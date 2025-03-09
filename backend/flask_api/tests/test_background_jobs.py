import pytest
import time
from datetime import datetime, timedelta
from unittest.mock import Mock, patch
from ..background_jobs import (
    JobManager,
    Job,
    JobQueue,
    JobStatus,
    JobError,
    ScheduledJob,
    JobWorker
)

class TestBackgroundJobs:
    """Test background job utilities"""

    @pytest.fixture
    def job_manager(self):
        """Create job manager instance"""
        return JobManager(
            config={
                'max_workers': 2,
                'queue_size': 100,
                'job_timeout': 300,
                'retry_limit': 3
            }
        )

    @pytest.fixture
    def job_queue(self):
        """Create job queue instance"""
        return JobQueue(max_size=100)

    @pytest.fixture
    def job_worker(self):
        """Create job worker instance"""
        return JobWorker(
            worker_id='worker1',
            max_jobs=10
        )

    def test_job_creation(self, job_manager):
        """Test job creation and properties"""
        # Create job
        job = job_manager.create_job(
            name='test_job',
            func='process_data',
            args=['data1'],
            kwargs={'param': 'value'}
        )

        assert job.name == 'test_job'
        assert job.status == JobStatus.PENDING
        assert job.created_at is not None
        assert job.started_at is None
        assert job.completed_at is None
        assert job.retries == 0

    def test_job_execution(self, job_manager):
        """Test job execution"""
        result_value = None

        def test_func(x, y):
            nonlocal result_value
            result_value = x + y
            return result_value

        # Create and execute job
        job = job_manager.create_job(
            name='addition',
            func=test_func,
            args=[2, 3]
        )
        job_manager.execute_job(job)

        assert job.status == JobStatus.COMPLETED
        assert job.result == 5
        assert result_value == 5
        assert job.completed_at is not None

    def test_job_queue_operations(self, job_queue):
        """Test job queue operations"""
        # Create jobs
        jobs = [
            Job(name=f'job{i}', func='test_func')
            for i in range(3)
        ]

        # Add jobs to queue
        for job in jobs:
            job_queue.push(job)

        assert job_queue.size == 3

        # Pop jobs
        popped_job = job_queue.pop()
        assert popped_job.name == 'job0'
        assert job_queue.size == 2

    def test_job_priority(self, job_queue):
        """Test job priority handling"""
        # Add jobs with different priorities
        job_queue.push(Job(name='low', priority=0))
        job_queue.push(Job(name='high', priority=2))
        job_queue.push(Job(name='medium', priority=1))

        # Check execution order
        assert job_queue.pop().name == 'high'
        assert job_queue.pop().name == 'medium'
        assert job_queue.pop().name == 'low'

    def test_job_scheduling(self, job_manager):
        """Test job scheduling"""
        schedule_time = datetime.now() + timedelta(seconds=1)

        # Schedule job
        job = job_manager.schedule_job(
            name='scheduled_test',
            func='test_func',
            schedule_time=schedule_time
        )

        assert job.status == JobStatus.SCHEDULED
        assert job.schedule_time == schedule_time

        # Wait for execution
        time.sleep(1.1)
        job_manager.process_scheduled_jobs()
        
        assert job.status != JobStatus.SCHEDULED

    def test_job_retry(self, job_manager):
        """Test job retry mechanism"""
        attempts = 0

        def failing_job():
            nonlocal attempts
            attempts += 1
            if attempts < 3:
                raise ValueError("Temporary failure")

        # Create job with retry policy
        job = job_manager.create_job(
            name='retry_test',
            func=failing_job,
            retry_limit=3
        )

        # Execute job
        job_manager.execute_job(job)

        assert job.status == JobStatus.COMPLETED
        assert job.retries == 2
        assert attempts == 3

    def test_job_timeout(self, job_manager):
        """Test job timeout handling"""
        def slow_job():
            time.sleep(2)

        # Create job with timeout
        job = job_manager.create_job(
            name='timeout_test',
            func=slow_job,
            timeout=1
        )

        # Execute job
        job_manager.execute_job(job)

        assert job.status == JobStatus.FAILED
        assert isinstance(job.error, JobError)
        assert "timeout" in str(job.error)

    def test_job_cancellation(self, job_manager):
        """Test job cancellation"""
        # Create job
        job = job_manager.create_job(
            name='cancel_test',
            func='test_func'
        )

        # Cancel job
        job_manager.cancel_job(job.id)
        assert job.status == JobStatus.CANCELLED

        # Try to execute cancelled job
        job_manager.execute_job(job)
        assert job.status == JobStatus.CANCELLED

    def test_worker_management(self, job_manager):
        """Test worker management"""
        # Start workers
        job_manager.start_workers(2)
        assert len(job_manager.get_active_workers()) == 2

        # Stop workers
        job_manager.stop_workers()
        assert len(job_manager.get_active_workers()) == 0

    def test_job_dependencies(self, job_manager):
        """Test job dependencies"""
        results = {}

        def job1():
            results['job1'] = True

        def job2():
            assert results.get('job1')
            results['job2'] = True

        # Create dependent jobs
        job1_instance = job_manager.create_job(
            name='job1',
            func=job1
        )
        job2_instance = job_manager.create_job(
            name='job2',
            func=job2,
            dependencies=[job1_instance.id]
        )

        # Execute jobs
        job_manager.execute_jobs([job1_instance, job2_instance])

        assert job1_instance.status == JobStatus.COMPLETED
        assert job2_instance.status == JobStatus.COMPLETED
        assert results['job1'] and results['job2']

    def test_job_progress_tracking(self, job_manager):
        """Test job progress tracking"""
        def progress_job(job):
            total_steps = 5
            for i in range(total_steps):
                job.update_progress(
                    (i + 1) / total_steps * 100,
                    f"Step {i + 1}/{total_steps}"
                )
                time.sleep(0.1)

        # Create and execute job
        job = job_manager.create_job(
            name='progress_test',
            func=progress_job
        )
        job_manager.execute_job(job)

        assert job.status == JobStatus.COMPLETED
        assert job.progress == 100
        assert "5/5" in job.status_message

    def test_job_events(self, job_manager):
        """Test job event handling"""
        events = []

        def event_handler(event):
            events.append(event)

        # Register event handlers
        job_manager.on_job_started(event_handler)
        job_manager.on_job_completed(event_handler)

        # Execute job
        job = job_manager.create_job(
            name='event_test',
            func=lambda: None
        )
        job_manager.execute_job(job)

        assert len(events) == 2
        assert events[0]['type'] == 'job_started'
        assert events[1]['type'] == 'job_completed'

    def test_job_cleanup(self, job_manager):
        """Test job cleanup"""
        # Create old completed jobs
        old_time = datetime.now() - timedelta(days=7)
        for i in range(3):
            job = job_manager.create_job(
                name=f'old_job_{i}',
                func=lambda: None
            )
            job.status = JobStatus.COMPLETED
            job.completed_at = old_time

        # Run cleanup
        cleaned = job_manager.cleanup_old_jobs(
            max_age=timedelta(days=1)
        )

        assert cleaned == 3
        assert len(job_manager.get_all_jobs()) == 0

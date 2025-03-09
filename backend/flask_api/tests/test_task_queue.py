import pytest
import time
from datetime import datetime, timedelta
from unittest.mock import Mock, patch
from ..task_queue import (
    TaskQueue,
    Task,
    Worker,
    TaskError,
    RetryPolicy,
    TaskScheduler
)

class TestTaskQueue:
    """Test task queue utilities"""

    @pytest.fixture
    def task_queue(self):
        """Create task queue instance"""
        return TaskQueue(
            config={
                'max_workers': 3,
                'queue_size': 100,
                'default_timeout': 30,
                'retry_policy': {
                    'max_retries': 3,
                    'delay': 5
                }
            }
        )

    @pytest.fixture
    def worker(self):
        """Create worker instance"""
        return Worker(
            worker_id='test_worker',
            max_tasks=10
        )

    @pytest.fixture
    def scheduler(self):
        """Create task scheduler instance"""
        return TaskScheduler(
            config={
                'timezone': 'UTC',
                'max_scheduled': 1000
            }
        )

    def test_basic_task_execution(self, task_queue):
        """Test basic task execution"""
        results = []

        def test_task(x, y):
            result = x + y
            results.append(result)
            return result

        # Submit task
        task = Task(
            func=test_task,
            args=(2, 3),
            task_id='test_task'
        )
        task_queue.submit(task)

        # Wait for execution
        task_queue.wait_for(task.id, timeout=5)
        assert results[0] == 5
        assert task.status == 'completed'

    def test_task_error_handling(self, task_queue):
        """Test task error handling"""
        def failing_task():
            raise ValueError('Test error')

        # Submit failing task
        task = Task(func=failing_task)
        task_queue.submit(task)

        # Wait for execution
        task_queue.wait_for(task.id, timeout=5)
        assert task.status == 'failed'
        assert isinstance(task.error, ValueError)
        assert str(task.error) == 'Test error'

    def test_task_retry_policy(self, task_queue):
        """Test task retry mechanism"""
        attempts = []

        def retry_task():
            attempts.append(datetime.now())
            if len(attempts) < 3:
                raise TaskError('Retry needed')
            return 'success'

        # Configure retry policy
        policy = RetryPolicy(
            max_retries=3,
            delay=1,
            backoff_factor=2
        )

        # Submit task with retry policy
        task = Task(
            func=retry_task,
            retry_policy=policy
        )
        task_queue.submit(task)

        # Wait for completion
        task_queue.wait_for(task.id, timeout=10)
        assert len(attempts) == 3
        assert task.status == 'completed'
        assert task.result == 'success'

    def test_worker_lifecycle(self, task_queue, worker):
        """Test worker lifecycle management"""
        # Start worker
        worker.start()
        assert worker.is_alive()

        # Process some tasks
        results = []
        for i in range(5):
            task = Task(
                func=lambda x: results.append(x),
                args=(i,)
            )
            task_queue.submit(task)

        # Wait for tasks to complete
        time.sleep(2)
        assert len(results) == 5
        assert sorted(results) == [0, 1, 2, 3, 4]

        # Stop worker
        worker.stop()
        assert not worker.is_alive()

    def test_task_scheduling(self, scheduler):
        """Test task scheduling"""
        executions = []

        def scheduled_task():
            executions.append(datetime.now())

        # Schedule task
        scheduler.schedule(
            task=Task(func=scheduled_task),
            trigger='interval',
            seconds=1
        )

        # Let it run for a few intervals
        scheduler.start()
        time.sleep(3.5)
        scheduler.stop()

        assert 3 <= len(executions) <= 4

    def test_task_priorities(self, task_queue):
        """Test task priority handling"""
        execution_order = []

        def priority_task(priority):
            execution_order.append(priority)

        # Submit tasks with different priorities
        tasks = [
            Task(func=priority_task, args=(i,), priority=i)
            for i in range(3)
        ]

        # Submit in reverse order
        for task in reversed(tasks):
            task_queue.submit(task)

        # Wait for all tasks
        task_queue.wait_all(timeout=5)
        assert execution_order == [2, 1, 0]  # Higher priority first

    def test_task_cancellation(self, task_queue):
        """Test task cancellation"""
        def long_running_task():
            time.sleep(10)
            return 'completed'

        # Submit task
        task = Task(func=long_running_task)
        task_queue.submit(task)

        # Cancel task
        time.sleep(0.5)  # Let it start
        task_queue.cancel(task.id)

        assert task.status == 'cancelled'
        with pytest.raises(TaskError):
            task.result

    def test_task_timeout(self, task_queue):
        """Test task timeout handling"""
        def timeout_task():
            time.sleep(5)

        # Submit task with short timeout
        task = Task(
            func=timeout_task,
            timeout=1
        )
        task_queue.submit(task)

        # Wait for task to timeout
        task_queue.wait_for(task.id, timeout=2)
        assert task.status == 'timeout'

    def test_task_dependencies(self, task_queue):
        """Test task dependencies"""
        results = {}

        def task_a():
            time.sleep(1)
            results['a'] = datetime.now()
            return 'a'

        def task_b(a_result):
            results['b'] = datetime.now()
            return f'b_{a_result}'

        # Create dependent tasks
        task_a = Task(func=task_a)
        task_b = Task(
            func=task_b,
            dependencies=[task_a]
        )

        # Submit tasks
        task_queue.submit(task_b)  # Submit dependent task first
        task_queue.submit(task_a)

        # Wait for completion
        task_queue.wait_all(timeout=5)
        
        assert results['a'] < results['b']
        assert task_b.result == 'b_a'

    def test_task_progress_tracking(self, task_queue):
        """Test task progress tracking"""
        def progress_task(progress_callback):
            for i in range(5):
                time.sleep(0.1)
                progress_callback(i * 20)
            return 'done'

        # Track progress
        progress_updates = []
        def progress_handler(progress):
            progress_updates.append(progress)

        # Submit task with progress tracking
        task = Task(
            func=progress_task,
            progress_callback=progress_handler
        )
        task_queue.submit(task)

        # Wait for completion
        task_queue.wait_for(task.id, timeout=5)
        assert progress_updates == [0, 20, 40, 60, 80]
        assert task.result == 'done'

    def test_task_batch_processing(self, task_queue):
        """Test batch task processing"""
        results = []

        def batch_task(items):
            results.extend(items)
            return len(items)

        # Create batch of tasks
        batch = [
            Task(func=batch_task, args=([i],))
            for i in range(10)
        ]

        # Submit batch
        task_queue.submit_batch(batch)

        # Wait for all tasks
        task_queue.wait_all(timeout=5)
        assert len(results) == 10
        assert sorted(results) == list(range(10))

    def test_task_state_persistence(self, task_queue):
        """Test task state persistence"""
        def persistent_task():
            return 'persistent_result'

        # Submit task
        task = Task(
            func=persistent_task,
            persist=True
        )
        task_queue.submit(task)

        # Wait for completion
        task_queue.wait_for(task.id, timeout=5)

        # Verify persistence
        saved_state = task_queue.load_task_state(task.id)
        assert saved_state['status'] == 'completed'
        assert saved_state['result'] == 'persistent_result'

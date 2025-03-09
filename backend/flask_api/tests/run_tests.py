#!/usr/bin/env python3
import os
import sys
import argparse
import pytest
import coverage
from datetime import datetime

def setup_coverage():
    """Initialize coverage reporting"""
    cov = coverage.Coverage(
        branch=True,
        source=['flask_api'],
        omit=[
            '*/tests/*',
            '*/migrations/*',
            '*/venv/*',
            '*/env/*'
        ]
    )
    cov.start()
    return cov

def run_tests(args):
    """Run tests with specified configuration"""
    # Prepare pytest arguments
    pytest_args = []
    
    # Add test paths
    if args.path:
        pytest_args.extend(args.path)
    else:
        pytest_args.append('.')

    # Add verbosity
    if args.verbose:
        pytest_args.append('-v')
    if args.very_verbose:
        pytest_args.append('-vv')

    # Add test selection options
    if args.integration:
        pytest_args.append('-m')
        pytest_args.append('integration')
    if args.run_slow:
        pytest_args.append('--run-slow')

    # Add failure options
    if args.failed_first:
        pytest_args.append('--failed-first')
    if args.last_failed:
        pytest_args.append('--last-failed')

    # Add output options
    if args.no_summary:
        pytest_args.append('-q')
    if args.tb_style:
        pytest_args.extend(['--tb', args.tb_style])

    # Initialize coverage if requested
    cov = setup_coverage() if args.coverage else None

    # Run tests
    result = pytest.main(pytest_args)

    # Generate coverage report if requested
    if cov:
        print("\nGenerating coverage report...")
        cov.stop()
        
        if args.html:
            # Generate HTML report
            report_dir = os.path.join('reports', 'coverage', datetime.now().strftime('%Y%m%d_%H%M%S'))
            os.makedirs(report_dir, exist_ok=True)
            cov.html_report(directory=report_dir)
            print(f"HTML coverage report generated in: {report_dir}")
        
        # Print coverage report to console
        cov.report()

    return result

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='Run Flask API tests')
    
    # Test selection options
    parser.add_argument('path', nargs='*', help='Path to test files or directories')
    parser.add_argument('-i', '--integration', action='store_true', help='Run integration tests')
    parser.add_argument('--run-slow', action='store_true', help='Run slow tests')
    
    # Output options
    parser.add_argument('-v', '--verbose', action='store_true', help='Verbose output')
    parser.add_argument('-vv', '--very-verbose', action='store_true', help='Very verbose output')
    parser.add_argument('-q', '--no-summary', action='store_true', help='Quiet output (no summary)')
    parser.add_argument('--tb', dest='tb_style', choices=['auto', 'long', 'short', 'line', 'native', 'no'],
                      help='Traceback print mode')
    
    # Failure options
    parser.add_argument('--ff', '--failed-first', action='store_true', dest='failed_first',
                      help='Run failed tests first')
    parser.add_argument('--lf', '--last-failed', action='store_true', dest='last_failed',
                      help='Run last failed tests only')
    
    # Coverage options
    parser.add_argument('-c', '--coverage', action='store_true', help='Generate coverage report')
    parser.add_argument('--html', action='store_true', help='Generate HTML coverage report')

    args = parser.parse_args()
    
    # Set up environment
    os.environ['FLASK_ENV'] = 'testing'
    os.environ['TESTING'] = 'true'
    
    # Add project root to Python path
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
    sys.path.insert(0, project_root)
    
    # Run tests
    result = run_tests(args)
    
    # Exit with appropriate status code
    sys.exit(result)

if __name__ == '__main__':
    main()

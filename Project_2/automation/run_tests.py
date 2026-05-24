"""
Main Test Execution Script
Runs all tests and generates HTML report
"""

import os
import sys
from datetime import datetime
from test_runner import TestRunner
from report_generator import HTMLReportGenerator


def main():
    """Main execution function"""
    
    # Get the directory of this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Paths
    test_data_file = os.path.join(script_dir, "test_data.json")
    report_file = os.path.join(script_dir, "..", "reports", "report.html")
    
    # Ensure reports directory exists
    reports_dir = os.path.dirname(report_file)
    if not os.path.exists(reports_dir):
        os.makedirs(reports_dir)
    
    print("=" * 80)
    print("RESTful Booker API - Test Automation Framework")
    print("=" * 80)
    print(f"Test execution started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Run tests
    try:
        runner = TestRunner(test_data_file)
        runner.run_all_tests()
        runner.print_results()
        
        # Get results
        results = runner.get_results()
        
        # Generate HTML report
        print("\nGenerating HTML report...")
        generator = HTMLReportGenerator(results)
        generator.save_report(report_file)
        
        # Print summary
        print("\n" + "=" * 80)
        print("EXECUTION SUMMARY")
        print("=" * 80)
        print(f"Test Data File: {test_data_file}")
        print(f"Report File: {report_file}")
        print(f"Execution completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 80)
        
        return 0
    
    except Exception as e:
        print(f"\nError during test execution: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())

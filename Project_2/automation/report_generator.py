"""
HTML Test Report Generator
Generates HTML report from test execution results
"""

import json
from datetime import datetime


class HTMLReportGenerator:
    """Generate HTML test reports"""
    
    def __init__(self, test_results):
        """
        Initialize report generator
        Args:
            test_results: List of test result dictionaries
        """
        self.test_results = test_results
        self.timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    def _calculate_statistics(self):
        """Calculate test statistics"""
        total = len(self.test_results)
        passed = sum(1 for r in self.test_results if r.get("status") == "Pass")
        failed = sum(1 for r in self.test_results if r.get("status") == "Fail")
        total_duration = sum(r.get("duration", 0) for r in self.test_results)
        
        return {
            "total": total,
            "passed": passed,
            "failed": failed,
            "total_duration": round(total_duration, 2),
            "pass_rate": round((passed / total * 100), 2) if total > 0 else 0
        }
    
    def _get_status_color(self, status):
        """Get color code for status"""
        if status == "Pass":
            return "#28a745"  # Green
        elif status == "Fail":
            return "#dc3545"  # Red
        else:
            return "#6c757d"  # Gray
    
    def _get_status_icon(self, status):
        """Get icon for status"""
        if status == "Pass":
            return "✓"
        elif status == "Fail":
            return "✗"
        else:
            return "—"
    
    def generate_html(self):
        """Generate HTML report content"""
        stats = self._calculate_statistics()
        
        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RESTful Booker API - Test Execution Report</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f5f5f5;
            color: #333;
            padding: 20px;
        }}
        
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }}
        
        header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }}
        
        header h1 {{
            font-size: 28px;
            margin-bottom: 10px;
        }}
        
        header p {{
            font-size: 14px;
            opacity: 0.9;
        }}
        
        .metrics {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 30px;
            background-color: #f9f9f9;
            border-bottom: 1px solid #e0e0e0;
        }}
        
        .metric {{
            background-color: white;
            padding: 20px;
            border-radius: 6px;
            text-align: center;
            border-left: 4px solid #667eea;
        }}
        
        .metric.passed {{
            border-left-color: #28a745;
        }}
        
        .metric.failed {{
            border-left-color: #dc3545;
        }}
        
        .metric.total {{
            border-left-color: #667eea;
        }}
        
        .metric-value {{
            font-size: 32px;
            font-weight: bold;
            color: #333;
            margin: 10px 0;
        }}
        
        .metric-label {{
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }}
        
        .results-section {{
            padding: 30px;
        }}
        
        .results-section h2 {{
            font-size: 20px;
            margin-bottom: 20px;
            color: #333;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }}
        
        .test-result {{
            margin-bottom: 15px;
            padding: 15px;
            border-left: 4px solid #ddd;
            border-radius: 4px;
            background-color: #f9f9f9;
            transition: all 0.3s ease;
        }}
        
        .test-result.passed {{
            border-left-color: #28a745;
            background-color: #f1f9f1;
        }}
        
        .test-result.failed {{
            border-left-color: #dc3545;
            background-color: #f9f1f1;
        }}
        
        .test-result-header {{
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 10px;
        }}
        
        .test-result-name {{
            font-weight: 600;
            font-size: 14px;
            flex: 1;
        }}
        
        .test-status {{
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }}
        
        .test-status.passed {{
            background-color: #28a745;
            color: white;
        }}
        
        .test-status.failed {{
            background-color: #dc3545;
            color: white;
        }}
        
        .test-details {{
            font-size: 12px;
            color: #666;
            margin-top: 10px;
        }}
        
        .test-details div {{
            margin: 5px 0;
        }}
        
        .test-details .label {{
            display: inline-block;
            min-width: 100px;
            font-weight: 600;
            color: #333;
        }}
        
        .error-message {{
            color: #dc3545;
            margin-top: 10px;
            padding: 10px;
            background-color: #f8d7da;
            border-radius: 4px;
            border-left: 3px solid #dc3545;
        }}
        
        footer {{
            background-color: #f5f5f5;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #e0e0e0;
            font-size: 12px;
            color: #666;
        }}
        
        .progress-bar {{
            width: 100%;
            height: 8px;
            background-color: #e0e0e0;
            border-radius: 4px;
            overflow: hidden;
            margin-top: 10px;
        }}
        
        .progress-fill {{
            height: 100%;
            background: linear-gradient(90deg, #28a745 0%, #20c997 100%);
            border-radius: 4px;
        }}
        
        @media (max-width: 768px) {{
            header h1 {{
                font-size: 20px;
            }}
            
            .metrics {{
                grid-template-columns: 1fr;
            }}
            
            .test-result-header {{
                flex-direction: column;
                align-items: flex-start;
            }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>RESTful Booker API - Test Execution Report</h1>
            <p>Generated on {self.timestamp}</p>
        </header>
        
        <div class="metrics">
            <div class="metric total">
                <div class="metric-label">Total Tests</div>
                <div class="metric-value">{stats["total"]}</div>
            </div>
            <div class="metric passed">
                <div class="metric-label">Tests Passed</div>
                <div class="metric-value">{stats["passed"]}</div>
            </div>
            <div class="metric failed">
                <div class="metric-label">Tests Failed</div>
                <div class="metric-value">{stats["failed"]}</div>
            </div>
            <div class="metric">
                <div class="metric-label">Pass Rate</div>
                <div class="metric-value">{stats["pass_rate"]}%</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: {stats["pass_rate"]}%"></div>
                </div>
            </div>
            <div class="metric">
                <div class="metric-label">Total Duration</div>
                <div class="metric-value">{stats["total_duration"]}s</div>
            </div>
        </div>
        
        <div class="results-section">
            <h2>Test Results</h2>
"""
        
        for result in self.test_results:
            status = result.get("status", "Not Executed")
            status_lower = status.lower()
            
            html += f"""            <div class="test-result {status_lower}">
                <div class="test-result-header">
                    <span class="test-result-name">{result.get("test_name", "Unknown")}</span>
                    <span class="test-status {status_lower}">{status}</span>
                </div>
                <div class="test-details">
                    <div><span class="label">Duration:</span> {result.get("duration", 0)}s</div>
"""
            
            if result.get("actual_result"):
                html += f"""                    <div><span class="label">Result:</span> {result.get("actual_result")}</div>
"""
            
            if result.get("error_message"):
                html += f"""                    <div class="error-message"><strong>Error:</strong> {result.get("error_message")}</div>
"""
            
            html += """                </div>
            </div>
"""
        
        html += """        </div>
        
        <footer>
            <p>This report was generated by the Keyword-Driven Automation Framework for RESTful Booker API</p>
            <p>Framework: Python + Requests | Test Data: Externalized JSON | Report Type: HTML</p>
        </footer>
    </div>
</body>
</html>
"""
        
        return html
    
    def save_report(self, output_file):
        """
        Save HTML report to file
        Args:
            output_file: Path to output HTML file
        """
        html_content = self.generate_html()
        
        try:
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(html_content)
            print(f"Report generated successfully: {output_file}")
            return True
        except Exception as e:
            print(f"Error generating report: {e}")
            return False


if __name__ == "__main__":
    # Example usage
    sample_results = [
        {
            "test_name": "TC_001: Create booking with valid data",
            "status": "Pass",
            "duration": 0.45,
            "error_message": "",
            "actual_result": "Booking created with ID: 12345"
        },
        {
            "test_name": "TC_002: Create booking with missing fields",
            "status": "Fail",
            "duration": 0.32,
            "error_message": "Expected 400, got 200",
            "actual_result": "Status: 200"
        }
    ]
    
    generator = HTMLReportGenerator(sample_results)
    generator.save_report("test_report.html")

from jinja2 import Template
from typing import Dict, Any, List

class ReportGeneratorService:
    @staticmethod
    def generate_html_report(pipeline_data: Dict[str, Any]) -> str:
        template_str = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>AI QA Engineer - Traceable Quality Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 40px; }
        .container { max-width: 900px; margin: 0 auto; background: #1e293b; border-radius: 16px; padding: 32px; border: 1px solid #334155; }
        h1 { color: #818cf8; margin-top: 0; }
        .scorecard { display: flex; gap: 16px; margin: 24px 0; }
        .card { flex: 1; background: #0f172a; padding: 20px; border-radius: 12px; border: 1px solid #334155; }
        .card-val { font-size: 28px; font-weight: 800; color: #38bdf8; margin: 8px 0 0 0; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; }
        .badge-ready { background: rgba(16, 185, 129, 0.2); color: #34d399; }
        .badge-notready { background: rgba(244, 63, 94, 0.2); color: #fb7185; }
        .finding { background: #0f172a; border: 1px solid #334155; padding: 16px; border-radius: 8px; margin-bottom: 12px; }
        .finding-crit { border-left: 4px solid #f43f5e; }
        .finding-med { border-left: 4px solid #f59e0b; }
        pre { background: #090d16; padding: 16px; border-radius: 8px; overflow-x: auto; color: #cbd5e1; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Traceable QA Quality Audit Report</h1>
        <p><strong>Requirement:</strong> {{ requirement.title }} (Source: {{ requirement.source }})</p>

        <div class="scorecard">
            <div class="card">
                <div>Requirement Score</div>
                <div class="card-val">{{ quality.score }}/100</div>
                <span class="badge {{ 'badge-ready' if quality.status == 'READY' else 'badge-notready' }}">{{ quality.status }}</span>
            </div>
            <div class="card">
                <div>Generated Test Suite</div>
                <div class="card-val">{{ tests | length }} Tests</div>
            </div>
            <div class="card">
                <div>Execution Outcome</div>
                <div class="card-val" style="color:#34d399">{{ executions[0].status }}</div>
            </div>
        </div>

        <h2>Requirement Quality Findings</h2>
        {% for finding in quality.findings %}
        <div class="finding {{ 'finding-crit' if finding.severity == 'CRITICAL' else 'finding-med' }}">
            <strong>[{{ finding.severity }}] {{ finding.title }}</strong>
            <p>{{ finding.description }}</p>
            {% if finding.recommendation %}
            <p><em>Recommendation: {{ finding.recommendation }}</em></p>
            {% endif %}
        </div>
        {% endfor %}

        <h2>Generated Test Suite & Traceability</h2>
        {% for tc in tests %}
        <div style="margin-bottom: 24px;">
            <h3>{{ tc.id }} - {{ tc.title }} ({{ tc.type }})</h3>
            <pre>{{ tc.gherkin }}</pre>
            <p><strong>Traceability Tag:</strong> <code>{{ tc.traceability_tag }}</code></p>
        </div>
        {% endfor %}
    </div>
</body>
</html>
        """
        template = Template(template_str)
        return template.render(
            requirement=pipeline_data.get("requirement", {}),
            quality=pipeline_data.get("requirement_quality", {}),
            tests=pipeline_data.get("test_cases", []),
            executions=pipeline_data.get("executions", [{}])
        )

report_generator = ReportGeneratorService()

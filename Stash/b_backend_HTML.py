from pathlib import Path
import json
from typing import Dict, Any, List
class ReportGenerator:
    """Generates HTML reports from analysis data"""
    
    def __init__(self, analysis_data: Dict[str, Any], output_dir: Path):
        self.analysis_data = analysis_data
        self.output_dir = output_dir
        # Add at the top of the ReportGenerator class, after __init__
    CODE_METRICS_THRESHOLDS = {
        'method': {
            'max_lines': 200,
            'max_parameters': 50,
            'max_cyclomatic': 100,
            'max_cognitive': 150
        },
        'class': {
            'max_methods': 200,
            'max_instance_vars': 100,
            'max_inheritance_depth': 30
        }
        
    }
    # Add at the top of ReportGenerator class
    CODE_METRICS_BASELINES = {
        'method': {
            'typical_lines': 100,
            'typical_parameters': 30,
            'typical_cyclomatic': 50,
            'typical_cognitive': 80
        },
        'class': {
            'typical_methods': 100,
            'typical_instance_vars': 50,
            'typical_inheritance_depth': 10
        }
}
    def generate_report(self) -> Path:
        """Generates and saves the HTML report"""
        html_content = self._generate_html()
        report_path = self.output_dir / 'b_backend_HTML.html'
        
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
            
        return report_path
    def _generate_directory_section(self) -> str:
        """Generates an interactive directory tree visualization"""
        if not self.analysis_data.get('directory_structure'):
            return ""
            
        return f"""
            <div class="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 class="text-2xl font-bold text-gray-900 mb-4">Project Structure</h2>
                <div id="directoryTree" class="min-h-[600px]">
                    <script>
                        const treeData = {json.dumps(self.analysis_data['directory_structure'])};
                        
                        const margin = {{top: 20, right: 20, bottom: 20, left: 40}};
                        const width = 960 - margin.left - margin.right;
                        const height = 800 - margin.top - margin.bottom;
                        
                        const tree = d3.tree().size([height, width]);
                        
                        const svg = d3.select("#directoryTree")
                            .append("svg")
                            .attr("width", width + margin.left + margin.right)
                            .attr("height", height + margin.top + margin.bottom)
                            .append("g")
                            .attr("transform", `translate(${{margin.left}},${{margin.top}})`);
                        
                        const root = d3.hierarchy(treeData);
                        const nodes = tree(root);
                        
                        // Add links between nodes
                        svg.selectAll(".link")
                            .data(nodes.links())
                            .enter().append("path")
                            .attr("class", "link")
                            .attr("fill", "none")
                            .attr("stroke", "#ccc")
                            .attr("d", d3.linkHorizontal()
                                .x(d => d.y)
                                .y(d => d.x));
                        
                        // Add nodes
                        const node = svg.selectAll(".node")
                            .data(nodes.descendants())
                            .enter().append("g")
                            .attr("class", d => "node" + (d.children ? " node--internal" : " node--leaf"))
                            .attr("transform", d => `translate(${{d.y}},${{d.x}})`);
                        
                        // Add node circles
                        node.append("circle")
                            .attr("r", 4)
                            .style("fill", d => d.data.type === "directory" ? "#4299e1" : "#48bb78");
                        
                        // Add node labels
                        node.append("text")
                            .attr("dy", ".31em")
                            .attr("x", d => d.children ? -8 : 8)
                            .style("text-anchor", d => d.children ? "end" : "start")
                            .text(d => d.data.name);
                    </script>
                </div>
            </div>
        """

    def _generate_services_section(self) -> str:
        """Generates the services and ports mapping section"""
        if not self.analysis_data.get('services'):
            return ""
            
        services_by_port = {}
        for service in self.analysis_data['services']:
            port = service['port']
            if port not in services_by_port:
                services_by_port[port] = []
            services_by_port[port].extend([(endpoint, service['file_path']) for endpoint in service['endpoints']])
        
        return f"""
            <div class="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 class="text-2xl font-bold text-gray-900 mb-4">Services and Ports</h2>
                <div class="grid gap-6">
                    {self._generate_port_cards(services_by_port)}
                </div>
            </div>
        """
        
    def _generate_port_cards(self, services_by_port: Dict[int, List[tuple]]) -> str:
        """Generates individual cards for each port and its services"""
        cards = []
        for port, endpoints in sorted(services_by_port.items()):
            endpoint_list = [  # Changed from string join to list comprehension
            '<div class="flex justify-between items-start border-b border-gray-200 py-2">'
            f'<span class="text-blue-600">{endpoint[0]}</span>'
            f'<span class="text-sm text-gray-500">{Path(endpoint[1]).name}</span>'
            '</div>'
            for endpoint in endpoints
        ]

            cards.append(f"""
            <div class="bg-gray-50 rounded-lg p-4">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Port {port}</h3>
            <div class="space-y-2">
            {endpoint_list}
            </div>
            </div>
            """)
        return '\n'.join(cards)

    def _generate_address_section(self) -> str:
        """Generates the address usage analysis section"""
        if not self.analysis_data.get('addresses'):
            return ""
            
        # Group addresses by type and file
        urls = [(addr, 'URL') for addr in self.analysis_data['addresses'] 
                if addr['address'].startswith(('http', 'https', 'localhost'))]
        ips = [(addr, 'IP') for addr in self.analysis_data['addresses'] 
               if not addr['address'].startswith(('http', 'https', 'localhost'))]
        
        addresses = sorted(urls + ips, key=lambda x: (x[0]['file_path'], x[0]['line_number']))
        
        address_rows = '\n'.join([
            f'''<tr class="hover:bg-gray-50">
                <td class="px-4 py-2 border-b border-gray-200">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          {'bg-blue-100 text-blue-800' if addr_type == 'URL' else 'bg-green-100 text-green-800'}">
                        {addr_type}
                    </span>
                </td>
                <td class="px-4 py-2 border-b border-gray-200">
                    <code class="text-sm bg-gray-100 rounded px-2 py-1">{addr['address']}</code>
                </td>
                <td class="px-4 py-2 border-b border-gray-200 text-sm">{Path(addr['file_path']).name}</td>
                <td class="px-4 py-2 border-b border-gray-200 text-sm">{addr['line_number']}</td>
                <td class="px-4 py-2 border-b border-gray-200 text-sm">
                    <code class="text-xs bg-gray-100 rounded px-2 py-1 break-all">{addr['context']}</code>
                </td>
            </tr>'''
            for addr, addr_type in addresses
        ])
        
        return f"""
            <div class="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 class="text-2xl font-bold text-gray-900 mb-4">Address Usage Analysis</h2>
                <div class="overflow-x-auto">
                    <table class="min-w-full border-collapse">
                        <thead>
                            <tr class="bg-gray-50">
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Line</th>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Context</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            {address_rows}
                        </tbody>
                    </table>
                </div>
            </div>
        """

    def _generate_logger_section(self) -> str:
        """Generates the logger configuration analysis section"""
        if not self.analysis_data.get('loggers'):
            return ""
            
        logger_rows = []
        for name, logger in sorted(self.analysis_data['loggers'].items()):
            handlers = ', '.join(logger['handler_types']) if logger['handler_types'] else 'No handlers'
            logger_rows.append(f"""
                <tr class="hover:bg-gray-50">
                    <td class="px-4 py-2 border-b border-gray-200 font-medium">{name}</td>
                    <td class="px-4 py-2 border-b border-gray-200">{Path(logger['file_path']).name}</td>
                    <td class="px-4 py-2 border-b border-gray-200">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {handlers}
                        </span>
                    </td>
                </tr>
            """)
            
        return f"""
            <div class="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 class="text-2xl font-bold text-gray-900 mb-4">Logger Configuration</h2>
                <div class="overflow-x-auto">
                    <table class="min-w-full border-collapse">
                        <thead>
                            <tr class="bg-gray-50">
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Logger Name</th>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source File</th>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Handlers</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            {''.join(logger_rows)}
                        </tbody>
                    </table>
                </div>
            </div>
        """
    def _generate_html(self) -> str:
        """Generates the HTML content with proper search functionality"""
        return f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Backend Code Analysis Report</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
     <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Backend Code Analysis Report</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body {{ font-family: 'Inter', sans-serif; }}
        .metric-card {{ transition: transform 0.2s; }}
        .metric-card:hover {{ transform: translateY(-2px); }}
        .search-highlight {{ background-color: yellow; }}
        .node circle {{ fill: #fff; stroke: steelblue; stroke-width: 3px; }}
        .node text {{ font: 12px sans-serif; }}
        .link {{ fill: none; stroke: #ccc; stroke-width: 2px; }}
    </style>
</head>
<body class="bg-gray-50">
    <div class="min-h-screen">
        <!-- Navigation -->
        <nav class="bg-white shadow-lg">
            <div class="max-w-7xl mx-auto px-4 py-6">
                <h1 class="text-3xl font-bold text-gray-900">Backend Code Analysis Report</h1>
                <p class="mt-1 text-sm text-gray-500">Generated on {self.analysis_data['timestamp']}</p>
            </div>
        </nav>

        <main class="max-w-7xl mx-auto px-4 py-8">
            {self._generate_search_controls()}
            {self._generate_overview_cards()}
            {self._generate_function_relationships_section()}  # Add this line
            {self._generate_complexity_section()}
            {self._generate_function_analysis_section()}  # New section
            {self._generate_dependency_graph()}          # New section
            {self._generate_insights_section()}          # New section
            {self._generate_directory_section()}
            {self._generate_file_table()}
            {self._generate_services_section()}
            {self._generate_address_section()}
            {self._generate_logger_section()}
            {self._generate_insights_section()}
        </main>
    </div>

    <script>
    document.addEventListener('DOMContentLoaded', function() {{
        const searchInput = document.getElementById('searchInput');
        const searchCategory = document.getElementById('searchCategory');
        const searchStats = document.getElementById('searchStats');
        const fileTable = document.getElementById('fileTable');
        const tbody = fileTable.getElementsByTagName('tbody')[0];
        const rows = tbody.getElementsByTagName('tr');
        
        function updateSearch() {{
            const searchText = searchInput.value.toLowerCase();
            const category = searchCategory.value;
            let matchCount = 0;
            
            Array.from(rows).forEach(row => {{
                const cells = row.getElementsByTagName('td');
                let shouldShow = false;
                
                if (category === 'all') {{
                    shouldShow = Array.from(cells).some(cell => 
                        cell.textContent.toLowerCase().includes(searchText)
                    );
                }} else {{
                    const cellIndex = {{'file': 0, 'complexity': 2, 'warnings': 5}}[category];
                    shouldShow = cells[cellIndex].textContent.toLowerCase().includes(searchText);
                }}
                
                if (shouldShow) {{
                    matchCount++;
                    row.style.display = '';
                    if (searchText) {{
                        Array.from(cells).forEach(cell => {{
                            const text = cell.textContent;
                            const highlightedText = text.replace(
                                new RegExp(searchText, 'gi'),
                                match => `<span class="search-highlight">${{match}}</span>`
                            );
                            cell.innerHTML = highlightedText;
                        }});
                    }}
                }} else {{
                    row.style.display = 'none';
                }}
            }});
            
            searchStats.textContent = `Found ${{matchCount}} matching files`;
        }}
        
        searchInput.addEventListener('input', updateSearch);
        searchCategory.addEventListener('change', updateSearch);
        
        // Initialize table sorting
        const headers = fileTable.getElementsByTagName('th');
        Array.from(headers).forEach((header, index) => {{
            header.addEventListener('click', () => {{
                const rows = Array.from(tbody.getElementsByTagName('tr'));
                const direction = header.classList.contains('sort-asc') ? -1 : 1;
                
                rows.sort((a, b) => {{
                    const aVal = a.cells[index].textContent;
                    const bVal = b.cells[index].textContent;
                    return direction * (isNaN(aVal) ? aVal.localeCompare(bVal) : aVal - bVal);
                }});
                
                Array.from(headers).forEach(h => h.classList.remove('sort-asc', 'sort-desc'));
                header.classList.toggle('sort-asc', direction === 1);
                header.classList.toggle('sort-desc', direction === -1);
                
                tbody.innerHTML = '';
                rows.forEach(row => tbody.appendChild(row));
            }});
        }});
    }});
    </script>
</body>
</html>
"""
    def _generate_function_analysis_section(self) -> str:
        """Generate function analysis visualization"""
        if not self.analysis_data.get('function_analysis'):
            return ""
            
        function_data = self.analysis_data['function_analysis']['functions']
        
        # Create complexity scatter plot data
        plot_data = [
            {
                'name': name,
                'cyclomatic': metrics['cyclomatic_complexity'],
                'cognitive': metrics['cognitive_complexity'],
                'parameters': metrics['parameter_count'],
                'dependencies': len(metrics['dependencies'])
            }
            for name, metrics in function_data.items()
        ]
        
        return f"""
            <div class="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 class="text-2xl font-bold text-gray-900 mb-4">Function Analysis</h2>
                
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Complexity scatter plot -->
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <div id="complexityPlot"></div>
                    </div>
                    
                    <!-- Function metrics table -->
                    <div class="bg-gray-50 p-4 rounded-lg overflow-x-auto">
                        <table class="min-w-full">
                            <thead>
                                <tr>
                                    <th class="px-4 py-2">Function</th>
                                    <th class="px-4 py-2">Complexity</th>
                                    <th class="px-4 py-2">Dependencies</th>
                                    <th class="px-4 py-2">Suggestions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {self._generate_function_rows(function_data)}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <script>
                    const plotData = {json.dumps(plot_data)};
                    
                    const trace = {{
                        x: plotData.map(d => d.cyclomatic),
                        y: plotData.map(d => d.cognitive),
                        mode: 'markers',
                        type: 'scatter',
                        text: plotData.map(d => d.name),
                        marker: {{
                            size: plotData.map(d => d.parameters * 5),
                            color: plotData.map(d => d.dependencies),
                            colorscale: 'Viridis'
                        }}
                    }};
                    
                    const layout = {{
                        title: 'Function Complexity Analysis',
                        xaxis: {{ title: 'Cyclomatic Complexity' }},
                        yaxis: {{ title: 'Cognitive Complexity' }},
                        hovermode: 'closest'
                    }};
                    
                    Plotly.newPlot('complexityPlot', [trace], layout);
                </script>
            </div>
        """
    def _generate_function_relationships_section(self) -> str:
        """Generates visualization of function dependencies and relationships"""
        if not self.analysis_data.get('functions'):
            return ""
            
        function_data = self.analysis_data['functions']
        
        # Create relationship network data
        nodes = []
        links = []
        for name, metrics in function_data.items():
            nodes.append({
                'id': name,
                'group': 1,
                'cyclomatic': metrics['cyclomatic_complexity'],
                'cognitive': metrics['cognitive_complexity']
            })
            
            # Add dependency links
            for dep in metrics.get('dependencies', []):
                links.append({
                    'source': name,
                    'target': dep,
                    'type': 'depends_on'
                })
                
            # Add caller links
            for caller in metrics.get('callers', []):
                links.append({
                    'source': caller,
                    'target': name,
                    'type': 'calls'
                })

        return f"""
            <div class="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 class="text-2xl font-bold text-gray-900 mb-4">Function Relationships</h2>
                
                <!-- Function dependency graph -->
                <div id="functionGraph" class="h-[600px] w-full border rounded-lg">
                    <script>
                        const nodes = {json.dumps(nodes)};
                        const links = {json.dumps(links)};
                        
                        const svg = d3.select("#functionGraph")
                            .append("svg")
                            .attr("width", "100%")
                            .attr("height", "100%");
                        
                        const simulation = d3.forceSimulation(nodes)
                            .force("link", d3.forceLink(links)
                                .id(d => d.id)
                                .distance(100))
                            .force("charge", d3.forceManyBody()
                                .strength(-200))
                            .force("center", d3.forceCenter(
                                svg.node().getBoundingClientRect().width / 2,
                                svg.node().getBoundingClientRect().height / 2
                            ));
                        
                        // Add directional arrows
                        svg.append("defs").append("marker")
                            .attr("id", "arrowhead")
                            .attr("viewBox", "-10 -10 20 20")
                            .attr("refX", 20)
                            .attr("refY", 0)
                            .attr("markerWidth", 6)
                            .attr("markerHeight", 6)
                            .attr("orient", "auto")
                            .append("path")
                            .attr("d", "M -10,-5 L 0,0 L -10,5")
                            .attr("fill", "#999");
                            
                        // Add links with arrows
                        const link = svg.append("g")
                            .selectAll("line")
                            .data(links)
                            .enter().append("line")
                            .attr("stroke-width", d => d.type === 'depends_on' ? 2 : 1)
                            .attr("stroke", d => d.type === 'depends_on' ? "#ff7f0e" : "#1f77b4")
                            .attr("marker-end", "url(#arrowhead)");
                        
                        // Add nodes with tooltips
                        const node = svg.append("g")
                            .selectAll("circle")
                            .data(nodes)
                            .enter().append("circle")
                            .attr("r", d => 5 + Math.sqrt(d.cyclomatic))
                            .attr("fill", d => d3.interpolateRdYlBu(1 - d.cognitive / 50))
                            .call(d3.drag()
                                .on("start", dragstarted)
                                .on("drag", dragged)
                                .on("end", dragended));
                                
                        // Add labels
                        const label = svg.append("g")
                            .selectAll("text")
                            .data(nodes)
                            .enter().append("text")
                            .text(d => d.id)
                            .attr("font-size", "8px")
                            .attr("dx", 12)
                            .attr("dy", ".35em");
                            
                        // Update positions on tick
                        simulation.on("tick", () => {{
                            link
                                .attr("x1", d => d.source.x)
                                .attr("y1", d => d.source.y)
                                .attr("x2", d => d.target.x)
                                .attr("y2", d => d.target.y);
                            
                            node
                                .attr("cx", d => d.x)
                                .attr("cy", d => d.y);
                                
                            label
                                .attr("x", d => d.x)
                                .attr("y", d => d.y);
                        }});
                        
                        // Helper functions for dragging
                        function dragstarted(event) {{
                            if (!event.active) simulation.alphaTarget(0.3).restart();
                            event.subject.fx = event.subject.x;
                            event.subject.fy = event.subject.y;
                        }}
                        
                        function dragged(event) {{
                            event.subject.fx = event.x;
                            event.subject.fy = event.y;
                        }}
                        
                        function dragended(event) {{
                            if (!event.active) simulation.alphaTarget(0);
                            event.subject.fx = null;
                            event.subject.fy = null;
                        }}
                    </script>
                </div>
            </div>
        """
    def _generate_function_rows(self, function_data: Dict) -> str:
        """Generate table rows for function metrics"""
        rows = []
        for name, metrics in function_data.items():
            complexity_class = (
                'text-red-600' if metrics['cyclomatic_complexity'] > 10
                else 'text-yellow-600' if metrics['cyclomatic_complexity'] > 5
                else 'text-green-600'
            )
            
            rows.append(f"""
                <tr class="hover:bg-gray-100">
                    <td class="px-4 py-2 font-medium">{name}</td>
                    <td class="px-4 py-2 {complexity_class}">
                        {metrics['cyclomatic_complexity']} / {metrics['cognitive_complexity']}
                    </td>
                    <td class="px-4 py-2">
                        {len(metrics['dependencies'])} in / {len(metrics['callers'])} out
                    </td>
                    <td class="px-4 py-2 text-sm">
                        {self._get_function_suggestions(metrics)}
                    </td>
                </tr>
            """)
        return '\n'.join(rows)

    def _generate_dependency_graph(self) -> str:
        """Generate interactive dependency visualization"""
        if not self.analysis_data.get('function_analysis', {}).get('module_dependencies'):
            return ""
            
        deps = self.analysis_data['function_analysis']['module_dependencies']
        nodes = list(set(
            list(deps.keys()) +
            [dep for deps_list in deps.values() for dep in deps_list]
        ))
        
        links = [
            {'source': source, 'target': target}
            for source, targets in deps.items()
            for target in targets
        ]
        
        return f"""
            <div class="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 class="text-2xl font-bold text-gray-900 mb-4">Module Dependencies</h2>
                <div id="dependencyGraph" class="h-96"></div>
                
                <script>
                    const nodes = {json.dumps([{'id': n} for n in nodes])};
                    const links = {json.dumps(links)};
                    
                    const simulation = d3.forceSimulation(nodes)
                        .force('link', d3.forceLink(links).id(d => d.id))
                        .force('charge', d3.forceManyBody().strength(-100))
                        .force('center', d3.forceCenter(400, 200));
                    
                    const svg = d3.select('#dependencyGraph')
                        .append('svg')
                        .attr('width', '100%')
                        .attr('height', '100%')
                        .attr('viewBox', '0 0 800 400');
                        
                    // Add arrow markers
                    svg.append('defs').append('marker')
                        .attr('id', 'arrowhead')
                        .attr('viewBox', '-0 -5 10 10')
                        .attr('refX', 15)
                        .attr('refY', 0)
                        .attr('orient', 'auto')
                        .attr('markerWidth', 6)
                        .attr('markerHeight', 6)
                        .append('path')
                        .attr('d', 'M 0,-5 L 10,0 L 0,5')
                        .attr('fill', '#999');
                    
                    const link = svg.append('g')
                        .selectAll('line')
                        .data(links)
                        .join('line')
                        .attr('stroke', '#999')
                        .attr('stroke-opacity', 0.6)
                        .attr('marker-end', 'url(#arrowhead)');
                    
                    const node = svg.append('g')
                        .selectAll('g')
                        .data(nodes)
                        .join('g')
                        .call(d3.drag()
                            .on('start', dragstarted)
                            .on('drag', dragged)
                            .on('end', dragended));
                    
                    node.append('circle')
                        .attr('r', 5)
                        .attr('fill', '#69b3a2');
                    
                    node.append('text')
                        .attr('x', 8)
                        .attr('y', '0.31em')
                        .text(d => d.id)
                        .clone(true).lower()
                        .attr('fill', 'none')
                        .attr('stroke', 'white')
                        .attr('stroke-width', 3);
                    
                    simulation.on('tick', () => {{
                        link
                            .attr('x1', d => d.source.x)
                            .attr('y1', d => d.source.y)
                            .attr('x2', d => d.target.x)
                            .attr('y2', d => d.target.y);
                        
                        node.attr('transform', d => `translate(${{d.x}},${{d.y}})`);
                    }});
                    
                    function dragstarted(event) {{
                        if (!event.active) simulation.alphaTarget(0.3).restart();
                        event.subject.fx = event.subject.x;
                        event.subject.fy = event.subject.y;
                    }}
                    
                    function dragged(event) {{
                        event.subject.fx = event.x;
                        event.subject.fy = event.y;
                    }}
                    
                    function dragended(event) {{
                        if (!event.active) simulation.alphaTarget(0);
                        event.subject.fx = null;
                        event.subject.fy = null;
                    }}
                </script>
            </div>
        """
    def _generate_overview_cards(self) -> str:
        """Generates the overview metrics cards section"""
        metrics = self.analysis_data['metrics']['size']
        return f"""
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div class="metric-card bg-white p-6 rounded-lg shadow-md">
                    <h3 class="text-lg font-semibold text-gray-700">Files Analyzed</h3>
                    <p class="text-3xl font-bold text-blue-600">{len(self.analysis_data['files'])}</p>
                </div>
                <div class="metric-card bg-white p-6 rounded-lg shadow-md">
                    <h3 class="text-lg font-semibold text-gray-700">Total Lines</h3>
                    <p class="text-3xl font-bold text-green-600">{metrics['total_lines']}</p>
                </div>
                <div class="metric-card bg-white p-6 rounded-lg shadow-md">
                    <h3 class="text-lg font-semibold text-gray-700">Functions</h3>
                    <p class="text-3xl font-bold text-purple-600">{metrics['function_count']}</p>
                </div>
                <div class="metric-card bg-white p-6 rounded-lg shadow-md">
                    <h3 class="text-lg font-semibold text-gray-700">Classes</h3>
                    <p class="text-3xl font-bold text-orange-600">{metrics['class_count']}</p>
                </div>
            </div>
        """
    def _generate_search_controls(self) -> str:
        """Generates the search interface"""
        return """
            <div class="mb-8 space-y-4">
                <div class="flex space-x-4">
                    <input type="text" 
                           id="searchInput" 
                           class="flex-1 p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500"
                           placeholder="Search for files, metrics, or warnings...">
                    <select id="searchCategory" 
                            class="p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500">
                        <option value="all">All Categories</option>
                        <option value="file">File Name</option>
                        <option value="complexity">Complexity</option>
                        <option value="warnings">Warnings</option>
                    </select>
                </div>
                <div id="searchStats" class="text-sm text-gray-600"></div>
            </div>
        """
    def _generate_complexity_section(self) -> str:
        """Generates the complexity metrics section"""
        complexity = self.analysis_data['metrics']['complexity']
        return f"""
            <div class="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 class="text-2xl font-bold text-gray-900 mb-4">Complexity Overview</h2>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="p-4 bg-gray-50 rounded-lg">
                        <h3 class="font-semibold text-gray-700">Cyclomatic Complexity</h3>
                        <p class="text-2xl font-bold text-blue-600">{complexity['cyclomatic']}</p>
                    </div>
                    <div class="p-4 bg-gray-50 rounded-lg">
                        <h3 class="font-semibold text-gray-700">Cognitive Complexity</h3>
                        <p class="text-2xl font-bold text-green-600">{complexity['cognitive']}</p>
                    </div>
                    <div class="p-4 bg-gray-50 rounded-lg">
                        <h3 class="font-semibold text-gray-700">Max Nesting Depth</h3>
                        <p class="text-2xl font-bold text-purple-600">{complexity['nesting_depth']}</p>
                    </div>
                </div>
            </div>
        """
    def _get_file_flags(self, analysis, file_path: str) -> tuple[List[str], Dict[str, float], str]:
        """Returns flags, deviations, and relevant code snippet for concerning files"""
        flags = []
        deviations = {}
        relevant_snippet = ""
        
        metrics = analysis['metrics']
        methods = analysis.get('methods', {})
        
        # Calculate deviations for method metrics
        for method_name, method_data in methods.items():
            lines_count = len(method_data.get('lines', []))
            lines_deviation = ((lines_count - self.CODE_METRICS_BASELINES['method']['typical_lines']) / 
                            self.CODE_METRICS_BASELINES['method']['typical_lines']) * 100
            
            if lines_count > self.CODE_METRICS_THRESHOLDS['method']['max_lines']:
                flags.append(f"Method '{method_name}' exceeds line limit: {lines_count} lines (+{lines_deviation:.1f}%)")
                deviations[f'{method_name}_lines'] = lines_deviation
                
                # Capture the problematic method's code
                if not relevant_snippet and method_data.get('lines'):
                    relevant_snippet = f"# Problematic method in {file_path}:\n"
                    relevant_snippet += "\n".join(method_data['lines'])
        
        # Complexity deviations
        cyclomatic = metrics['complexity']['cyclomatic']
        cyclo_deviation = ((cyclomatic - self.CODE_METRICS_BASELINES['method']['typical_cyclomatic']) /
                        self.CODE_METRICS_BASELINES['method']['typical_cyclomatic']) * 100
        
        if cyclomatic > self.CODE_METRICS_THRESHOLDS['method']['max_cyclomatic']:
            flags.append(f"High cyclomatic complexity: {cyclomatic} (+{cyclo_deviation:.1f}%)")
            deviations['cyclomatic'] = cyclo_deviation
        
        cognitive = metrics['complexity']['cognitive']
        cog_deviation = ((cognitive - self.CODE_METRICS_BASELINES['method']['typical_cognitive']) /
                        self.CODE_METRICS_BASELINES['method']['typical_cognitive']) * 100
        
        if cognitive > self.CODE_METRICS_THRESHOLDS['method']['max_cognitive']:
            flags.append(f"High cognitive complexity: {cognitive} (+{cog_deviation:.1f}%)")
            deviations['cognitive'] = cog_deviation
        
        return flags, deviations, relevant_snippet
    def _generate_file_table(self) -> str:
        """Generates the file analysis table"""
        table_rows = []
        sorted_files = sorted(
            self.analysis_data['files'].items(),
            key=lambda x: x[1]['metrics']['complexity']['cyclomatic'],
            reverse=True
        )
        
        for file_path, analysis in sorted_files:
            flags, deviations, snippet = self._get_file_flags(analysis, file_path)
            
            flag_html = ""
            if flags:
                flag_items = []
                for flag in flags:
                    severity_class = "text-red-600" if any(high in flag for high in ["+100%", "+150%", "+200%"]) else "text-yellow-600"
                    flag_items.append(f'<li class="text-xs {severity_class}">{flag}</li>')
                
                flag_html = f'<ul class="mt-1">{"".join(flag_items)}</ul>'
                
                if snippet:
                    flag_html += f"""
                        <div class="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                            <pre><code>{snippet}</code></pre>
                        </div>
                    """
            
            max_deviation = max(deviations.values()) if deviations else 0
            severity_class = "bg-red-50" if max_deviation > 100 else "bg-yellow-50" if max_deviation > 50 else ""
            
            table_rows.append(f"""
                <tr class="hover:bg-gray-50 {severity_class}">
                    <td class="px-6 py-4">
                        <div class="font-medium text-gray-900">{file_path}</div>
                        {flag_html}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{analysis['metrics']['size']['total_lines']}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{analysis['metrics']['complexity']['cyclomatic']}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{analysis['metrics']['size']['function_count']}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{analysis['metrics']['size']['class_count']}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{len(analysis['warnings'])}</td>
                </tr>
            """)
        
        return f"""
            <div class="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 class="text-2xl font-bold text-gray-900 mb-4">File Analysis</h2>
                <div class="overflow-x-auto">
                    <table class="min-w-full" id="fileTable">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">File</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">Lines</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">Complexity</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">Functions</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">Classes</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">Warnings</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            {''.join(table_rows)}
                        </tbody>
                    </table>
                </div>
            </div>
        """

    def _generate_insights_section(self) -> str:
        """Generates the insights section"""
        insights_html = ''.join(
            f'<li class="flex items-start"><span class="flex-shrink-0 h-6 w-6 text-blue-500">•</span>'
            f'<span class="ml-3 text-gray-700">{insight}</span></li>'
            for insight in self.analysis_data['insights']
        )
        
        return f"""
            <div class="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 class="text-2xl font-bold text-gray-900 mb-4">Insights</h2>
                <ul class="space-y-4">
                    {insights_html}
                </ul>
            </div>
        """
    def _generate_search_script(self) -> str:
        """Generates the JavaScript for search functionality"""
        return """
            document.addEventListener('DOMContentLoaded', function() {
                const searchInput = document.getElementById('searchInput');
                const searchCategory = document.getElementById('searchCategory');
                const searchStats = document.getElementById('searchStats');
                const fileTable = document.getElementById('fileTable');
                
                if (!fileTable) return;
                
                const tbody = fileTable.getElementsByTagName('tbody')[0];
                const rows = tbody.getElementsByTagName('tr');
                
                function updateSearch() {
                    const searchText = searchInput.value.toLowerCase();
                    const category = searchCategory.value;
                    let matchCount = 0;
                    
                    Array.from(rows).forEach(row => {
                        const cells = row.getElementsByTagName('td');
                        let shouldShow = false;
                        
                        if (category === 'all') {
                            shouldShow = Array.from(cells).some(cell => 
                                cell.textContent.toLowerCase().includes(searchText)
                            );
                        } else {
                            const cellIndex = {'file': 0, 'complexity': 2, 'warnings': 5}[category];
                            shouldShow = cells[cellIndex].textContent.toLowerCase().includes(searchText);
                        }
                        
                        row.style.display = shouldShow ? '' : 'none';
                        if (shouldShow) matchCount++;
                    });
                    
                    searchStats.textContent = `Found ${matchCount} matching files`;
                }
                
                searchInput.addEventListener('input', updateSearch);
                searchCategory.addEventListener('change', updateSearch);
            });
        """

    def _generate_sort_script(self) -> str:
        """Generates the JavaScript for table sorting"""
        return """
            document.addEventListener('DOMContentLoaded', function() {
                const fileTable = document.getElementById('fileTable');
                if (!fileTable) return;
                
                const headers = fileTable.getElementsByTagName('th');
                const tbody = fileTable.getElementsByTagName('tbody')[0];
                
                Array.from(headers).forEach((header, index) => {
                    header.addEventListener('click', () => {
                        const rows = Array.from(tbody.getElementsByTagName('tr'));
                        const direction = header.classList.contains('sort-asc') ? -1 : 1;
                        
                        rows.sort((a, b) => {
                            const aVal = a.cells[index].textContent;
                            const bVal = b.cells[index].textContent;
                            return direction * (isNaN(aVal) ? aVal.localeCompare(bVal) : aVal - bVal);
                        });
                        
                        Array.from(headers).forEach(h => h.classList.remove('sort-asc', 'sort-desc'));
                        header.classList.toggle('sort-asc', direction === 1);
                        header.classList.toggle('sort-desc', direction === -1);
                        
                        tbody.innerHTML = '';
                        rows.forEach(row => tbody.appendChild(row));
                    });
                });
            });
        """

# At the end of Backend_HTML.py

def main():
    # Path to the JSON file in backend directory
    json_path = Path(r"C:\Users\md8w7\OneDrive University of Missouri\Desktop\ImportantFiles\Milestone4\backend\a_backend_project_analyzer.json")
    
    # Read the analysis results
    with open(json_path, 'r', encoding='utf-8') as f:
        analysis_results = json.load(f)
    
    # Create report generator and generate HTML
    report_generator = ReportGenerator(analysis_results, Path(json_path).parent)
    report_path = report_generator.generate_report()
    
    print(f"HTML report generated at {report_path}")

if __name__ == "__main__":
    main()
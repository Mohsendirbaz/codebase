from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Dict, List, Set, Optional, Any
import ast
import json
import re
from datetime import datetime
import networkx as nx
import logging
from collections import defaultdict
from dataclasses import dataclass, field, asdict
from typing import Dict, List, Set, Optional
import ast
from d_function_collection import FunctionAnalyzer, FunctionalGroup, FunctionProfile, CodePattern

@dataclass
class ComplexityMetrics:
    """Stores code complexity metrics"""
    cyclomatic: int = 0
    cognitive: int = 0
    nesting_depth: int = 0
    return_count: int = 0
    branch_count: int = 0
    loop_count: int = 0
    exception_count: int = 0

    def to_dict(self):
        return asdict(self)

@dataclass
class FileMetrics:
    """Stores file-level metrics"""
    total_lines: int = 0
    code_lines: int = 0
    doc_lines: int = 0
    comment_lines: int = 0
    blank_lines: int = 0
    function_count: int = 0
    class_count: int = 0
    complexity: ComplexityMetrics = field(default_factory=ComplexityMetrics)

    def to_dict(self):
        result = asdict(self)
        result['complexity'] = self.complexity.to_dict()
        return result

class ComplexityVisitor(ast.NodeVisitor):
    """AST visitor that computes complexity metrics"""
    
    def __init__(self):
        self.metrics = ComplexityMetrics()
        self._current_depth = 0
        self._max_depth = 0
        
    def visit_If(self, node: ast.If):
        self.metrics.cyclomatic += 1
        self.metrics.branch_count += 1
        self._handle_nesting(node)
        self.generic_visit(node)
        
    def visit_While(self, node: ast.While):
        self.metrics.cyclomatic += 1
        self.metrics.loop_count += 1
        self._handle_nesting(node)
        self.generic_visit(node)
        
    def visit_For(self, node: ast.For):
        self.metrics.cyclomatic += 1
        self.metrics.loop_count += 1
        self._handle_nesting(node)
        self.generic_visit(node)
        
    def visit_Match(self, node: ast.Match):
        self.metrics.cyclomatic += len(node.cases)
        self.metrics.branch_count += len(node.cases)
        self._handle_nesting(node)
        self.generic_visit(node)
        
    def visit_ListComp(self, node: ast.ListComp):
        self.metrics.cyclomatic += 1
        self.generic_visit(node)
        
    def visit_Return(self, node: ast.Return):
        self.metrics.return_count += 1
        self.generic_visit(node)
        
    def visit_ExceptHandler(self, node: ast.ExceptHandler):
        self.metrics.cyclomatic += 1
        self.metrics.exception_count += 1
        self._handle_nesting(node)
        self.generic_visit(node)
        
    def _handle_nesting(self, node: ast.AST):
        """Tracks nesting depth and updates cognitive complexity"""
        self._current_depth += 1
        self._max_depth = max(self._max_depth, self._current_depth)
        self.metrics.cognitive += self._current_depth
        self.generic_visit(node)
        self._current_depth -= 1
        
    def finalize(self) -> ComplexityMetrics:
        """Returns the final complexity metrics"""
        self.metrics.nesting_depth = self._max_depth
        return self.metrics

def calculate_file_metrics(content: str) -> FileMetrics:
    """Calculates metrics for a single file"""
    metrics = FileMetrics()
    
    # Parse lines
    lines = content.splitlines()
    metrics.total_lines = len(lines)
    metrics.blank_lines = len([l for l in lines if not l.strip()])
    metrics.comment_lines = len([l for l in lines if l.strip().startswith('#')])
    metrics.code_lines = metrics.total_lines - metrics.blank_lines - metrics.comment_lines
    
    try:
        # Parse AST and collect metrics
        tree = ast.parse(content)
        
        # Count functions and classes
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                metrics.function_count += 1
            elif isinstance(node, ast.ClassDef):
                metrics.class_count += 1
        
        # Calculate complexity metrics
        complexity_visitor = ComplexityVisitor()
        complexity_visitor.visit(tree)
        metrics.complexity = complexity_visitor.finalize()
        
    except SyntaxError:
        # Handle files that can't be parsed as Python
        pass
    
    return metrics


@dataclass
class ServiceInfo:
    port: int
    endpoints: List[str]
    file_path: str

@dataclass
class AddressInfo:
    address: str
    context: str
    file_path: str
    line_number: int

@dataclass
class LoggerInfo:
    name: str
    file_path: str
    handler_types: List[str]

class DirectoryAnalyzer:
    """Analyzes project directory structure"""
    
    def __init__(self, root_path: Path):
        self.root = root_path
        
    def analyze(self) -> Dict[str, Any]:
        """Creates a hierarchical representation of the project structure"""
        structure = {
            "name": self.root.name,
            "type": "directory",
            "children": []
        }
        
        def build_tree(path: Path, node: Dict[str, Any]):
            for item in sorted(path.iterdir()):
                if item.name.startswith('.') or item.name == '__pycache__':
                    continue
                    
                child = {
                    "name": item.name,
                    "type": "directory" if item.is_dir() else "file",
                    "path": str(item.relative_to(self.root))
                }
                
                if item.is_dir():
                    child["children"] = []
                    build_tree(item, child)
                else:
                    child["extension"] = item.suffix
                    
                node["children"].append(child)
                
        build_tree(self.root, structure)
        return structure

class ServiceAnalyzer:
    """Analyzes services and their port configurations"""
    
    def __init__(self):
        self.port_pattern = re.compile(r'(?:localhost|127\.0\.0\.1):(\d+)')
        self.services: Dict[int, ServiceInfo] = {}
        
    def analyze_file(self, file_path: Path) -> None:
        """Extracts service information from a single file"""
        try:
            content = file_path.read_text(encoding='utf-8')
            
            # Find all port numbers in the file
            for match in self.port_pattern.finditer(content):
                port = int(match.group(1))
                
                # Parse the file to find associated endpoints
                tree = ast.parse(content)
                endpoints = self._extract_endpoints(tree)
                
                if port not in self.services:
                    self.services[port] = ServiceInfo(
                        port=port,
                        endpoints=endpoints,
                        file_path=str(file_path)
                    )
                else:
                    self.services[port].endpoints.extend(endpoints)
                    
        except Exception as e:
            logging.warning(f"Error analyzing services in {file_path}: {e}")
            
    def _extract_endpoints(self, tree: ast.AST) -> List[str]:
        """Extracts endpoint paths from route decorators"""
        endpoints = []
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                for decorator in node.decorator_list:
                    if isinstance(decorator, ast.Call):
                        if hasattr(decorator.func, 'attr') and decorator.func.attr == 'route':
                            if decorator.args:
                                if isinstance(decorator.args[0], ast.Constant):
                                    endpoints.append(decorator.args[0].value)
        return endpoints

class AddressAnalyzer:
    """Analyzes IP addresses and URLs in the codebase"""
    
    def __init__(self):
        self.ip_pattern = re.compile(r'\b(?:\d{1,3}\.){3}\d{1,3}\b')
        self.url_pattern = re.compile(r'https?://[^\s<>"\']+|localhost:\d+')
        self.addresses: List[AddressInfo] = []
        
    def analyze_file(self, file_path: Path) -> None:
        """Extracts address information from a single file"""
        try:
            content = file_path.read_text(encoding='utf-8')
            lines = content.splitlines()
            
            for i, line in enumerate(lines, 1):
                # Find IP addresses
                for match in self.ip_pattern.finditer(line):
                    self.addresses.append(AddressInfo(
                        address=match.group(),
                        context=line.strip(),
                        file_path=str(file_path),
                        line_number=i
                    ))
                    
                # Find URLs
                for match in self.url_pattern.finditer(line):
                    self.addresses.append(AddressInfo(
                        address=match.group(),
                        context=line.strip(),
                        file_path=str(file_path),
                        line_number=i
                    ))
                    
        except Exception as e:
            logging.warning(f"Error analyzing addresses in {file_path}: {e}")

class LoggerAnalyzer:
    """Analyzes logging configuration and usage"""
    
    def __init__(self):
        self.loggers: Dict[str, LoggerInfo] = {}
        
    def analyze_file(self, file_path: Path) -> None:
        """Extracts logger information from a single file"""
        try:
            content = file_path.read_text(encoding='utf-8')
            tree = ast.parse(content)
            
            for node in ast.walk(tree):
                # Find logger instantiations
                if isinstance(node, ast.Assign):
                    if isinstance(node.value, ast.Call):
                        if self._is_logger_creation(node.value):
                            logger_name = self._extract_logger_name(node)
                            handlers = self._find_handlers(tree)
                            
                            if logger_name:
                                self.loggers[logger_name] = LoggerInfo(
                                    name=logger_name,
                                    file_path=str(file_path),
                                    handler_types=handlers
                                )
                                
        except Exception as e:
            logging.warning(f"Error analyzing loggers in {file_path}: {e}")
            
    def _is_logger_creation(self, node: ast.Call) -> bool:
        """Checks if an AST node represents logger creation"""
        return (
            isinstance(node.func, ast.Attribute) and 
            node.func.attr == 'getLogger'
        ) or (
            isinstance(node.func, ast.Name) and 
            node.func.id == 'getLogger'
        )
        
    def _extract_logger_name(self, node: ast.Assign) -> Optional[str]:
        """Extracts the logger name from an assignment node"""
        for target in node.targets:
            if isinstance(target, ast.Name):
                return target.id
        return None
        
    def _find_handlers(self, tree: ast.AST) -> List[str]:
        """Finds logger handler types in the AST"""
        handlers = []
        for node in ast.walk(tree):
            if isinstance(node, ast.Call):
                if isinstance(node.func, ast.Attribute) and node.func.attr == 'addHandler':
                    if isinstance(node.args[0], ast.Call):
                        handler = node.args[0].func
                        if isinstance(handler, ast.Name):
                            handlers.append(handler.id)
        return handlers

# Update the main BackendAnalyzer class to include new analyzers
class BackendAnalyzer:
    def __init__(self, project_backend: str):
        self.root = Path(project_backend)
        self.analysis_cache: Dict[str, Dict] = {}
        self.dependency_graph = nx.DiGraph()
        self.function_analysis_data = None  # Add this to store function analysis
        
        # Initialize analyzers
        self.directory_analyzer = DirectoryAnalyzer(self.root)
        self.service_analyzer = ServiceAnalyzer()
        self.address_analyzer = AddressAnalyzer()
        self.logger_analyzer = LoggerAnalyzer()
        self.function_analyzer = FunctionAnalyzer()  # Updated to use enhanced analyzer

    def analyze_project(self) -> Dict:
        results = {
            'timestamp': datetime.now().isoformat(),
            'project_backend': str(self.root),
            'files': {},
            'metrics': {},
            'warnings': [],
            'insights': [],
            'directory_structure': {},
            'services': [],
            'addresses': [],
            'loggers': {},
            'function_analysis': {}
        }
        
        # Run standard analysis
        results['directory_structure'] = self.directory_analyzer.analyze()
        
        # Analyze files
        for py_file in self.root.rglob('*.py'):
            if 'Original' in py_file.parts or 'venv' in py_file.parts:
                continue
                
            try:
                file_analysis = self._analyze_file(py_file)
                rel_path = str(py_file.relative_to(self.root))
                self.analysis_cache[rel_path] = file_analysis
                results['files'][rel_path] = file_analysis
                
                self.service_analyzer.analyze_file(py_file)
                self.address_analyzer.analyze_file(py_file)
                self.logger_analyzer.analyze_file(py_file)
            except Exception as e:
                results['warnings'].append(f"Error analyzing {py_file}: {str(e)}")
        
        # Add standard analysis results
        results['services'] = [asdict(service) for service in self.service_analyzer.services.values()]
        results['addresses'] = [asdict(addr) for addr in self.address_analyzer.addresses]
        results['loggers'] = {name: asdict(logger) for name, logger in self.logger_analyzer.loggers.items()}
        function_results = self.function_analyzer.analyze_directory(self.root)

        results['function_analysis'] = function_results

        # Store function analysis results
        self.function_analysis_data = self.function_analyzer.analyze_directory(self.root)
        results['function_analysis'] = self.function_analysis_data
        
        # Generate final insights and metrics
        results['metrics'] = self._calculate_project_metrics()
        results['insights'] = self._generate_insights()  # No argument needed

        # Save results
        output_path = self.root / 'backend_analysis.json'
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2)
            
        return results

    def _generate_insights(self) -> List[str]:
        insights = []
        
        # Original file-level dependency analysis
        try:
            cycles = list(nx.simple_cycles(self.dependency_graph))
            if cycles:
                insights.append(f"Circular dependencies detected in files: {cycles}")
        except nx.NetworkXNoCycle:
            pass
            
        # Original file complexity analysis
        high_complexity_files = [
            path for path, analysis in self.analysis_cache.items()
            if analysis['metrics']['complexity']['cyclomatic'] > 10
        ]
        if high_complexity_files:
            insights.append(f"Files needing refactoring: {high_complexity_files}")
        
        # Function-level analysis - using stored function analysis data
        if self.function_analysis_data:
            # Function-level circular dependencies
            if self.function_analysis_data.get('circular_dependencies'):
                insights.append(f"Circular dependencies between functions: {self.function_analysis_data['circular_dependencies']}")
            
            # Function complexity hotspots
            if self.function_analysis_data.get('complexity_hotspots'):
                insights.append("Individual functions requiring refactoring:")
                for hotspot in self.function_analysis_data['complexity_hotspots']:
                    insights.append(f"- {hotspot['name']}: {hotspot['suggestion']}")
            
            # Module coupling analysis
            module_deps = self.function_analysis_data.get('module_dependencies', {})
            highly_coupled = [m for m, deps in module_deps.items() if len(deps) > 5]
            if highly_coupled:
                insights.append(f"Highly coupled modules (>5 dependencies): {', '.join(highly_coupled)}")
            
        return insights

   
    def _make_serializable(self, data):
        if isinstance(data, (ComplexityMetrics, FileMetrics)):
            return data.to_dict()
        elif isinstance(data, dict):
            return {k: self._make_serializable(v) for k, v in data.items()}
        elif isinstance(data, list):
            return [self._make_serializable(item) for item in data]
        elif isinstance(data, Path):
            return str(data)
        return data
    
    def _analyze_file(self, file_path: Path) -> Dict:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        tree = ast.parse(content)
        lines = content.splitlines()
        
        metrics = self._calculate_file_metrics(tree, lines)
        
        complexity_visitor = ComplexityVisitor()
        complexity_visitor.visit(tree)
        complexity = complexity_visitor.finalize()
        
        return {
            'path': str(file_path),
            'metrics': {
                'size': metrics.to_dict(),
                'complexity': complexity.to_dict()
            },
            'imports': self._extract_imports(tree),
            'api_routes': self._detect_routes(tree),
            'warnings': self._detect_warnings(tree, metrics, complexity)
        }
    
    def _calculate_file_metrics(self, tree: ast.AST, lines: List[str]) -> FileMetrics:
        metrics = FileMetrics()
        
        metrics.total_lines = len(lines)
        metrics.blank_lines = len([l for l in lines if not l.strip()])
        metrics.comment_lines = len([l for l in lines if l.strip().startswith('#')])
        
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                metrics.function_count += 1
            elif isinstance(node, ast.ClassDef):
                metrics.class_count += 1
                
        metrics.code_lines = metrics.total_lines - metrics.blank_lines - metrics.comment_lines
        return metrics
    
    def _extract_imports(self, tree: ast.AST) -> List[Dict]:
        imports = []
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for name in node.names:
                    imports.append({
                        'type': 'direct',
                        'module': name.name,
                        'alias': name.asname
                    })
            elif isinstance(node, ast.ImportFrom):
                imports.append({
                    'type': 'from',
                    'module': node.module,
                    'names': [n.name for n in node.names],
                    'level': node.level
                })
        return imports
    
    def _detect_routes(self, tree: ast.AST) -> List[Dict]:
        routes = []
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                for decorator in node.decorator_list:
                    if isinstance(decorator, ast.Call):
                        if hasattr(decorator.func, 'attr') and decorator.func.attr == 'route':
                            methods = []
                            if decorator.keywords:
                                for kw in decorator.keywords:
                                    if kw.arg == 'methods' and isinstance(kw.value, ast.List):
                                        methods = [elt.value for elt in kw.value.elts if isinstance(elt, ast.Constant)]
                            route_path = ''
                            if decorator.args:
                                if isinstance(decorator.args[0], ast.Constant):
                                    route_path = decorator.args[0].value
                                elif isinstance(decorator.args[0], ast.Str):  # For backward compatibility
                                    route_path = decorator.args[0].s
                            routes.append({
                                'path': route_path,
                                'function': node.name,
                                'methods': methods or ['GET']
                            })
        return routes
    
    def _detect_warnings(self, tree: ast.AST, metrics: FileMetrics, 
                        complexity: ComplexityMetrics) -> List[str]:
        warnings = []
        
        if complexity.cyclomatic > 10:
            warnings.append(f"High cyclomatic complexity: {complexity.cyclomatic}")
        if complexity.cognitive > 15:
            warnings.append(f"High cognitive complexity: {complexity.cognitive}")
        if complexity.nesting_depth > 4:
            warnings.append(f"Deep nesting detected: {complexity.nesting_depth} levels")
        if metrics.function_count > 20:
            warnings.append(f"Too many functions: {metrics.function_count}")
            
        return warnings
    
    def _calculate_project_metrics(self) -> Dict:
        total_metrics = FileMetrics()
        total_complexity = ComplexityMetrics()
        
        # Calculate file-level metrics
        for analysis in self.analysis_cache.values():
            metrics = analysis['metrics']
            total_metrics.total_lines += metrics['size']['total_lines']
            total_metrics.code_lines += metrics['size']['code_lines']
            total_metrics.function_count += metrics['size']['function_count']
            total_metrics.class_count += metrics['size']['class_count']
            
            complexity = metrics['complexity']
            total_complexity.cyclomatic += complexity['cyclomatic']
            total_complexity.cognitive += complexity['cognitive']
            total_complexity.nesting_depth = max(
                total_complexity.nesting_depth,
                complexity['nesting_depth']
            )
        
        # Incorporate function analysis metrics
        function_metrics = self.function_analyzer.analyze_directory(self.root)
        
        return {
            'size': {
                'total_lines': total_metrics.total_lines,
                'code_lines': total_metrics.code_lines,
                'function_count': total_metrics.function_count,
                'class_count': total_metrics.class_count,
                'groups': function_metrics['metrics']['size']['groups']
            },
            'complexity': {
                'cyclomatic': total_complexity.cyclomatic,
                'cognitive': total_complexity.cognitive,
                'nesting_depth': total_complexity.nesting_depth,
                'function_level': {
                    'average_cyclomatic': function_metrics['metrics']['complexity']['cyclomatic'] / 
                        max(len(function_metrics['functions']), 1),
                    'total_dependencies': function_metrics['metrics']['complexity']['dependencies'],
                    'group_complexity': self._calculate_group_complexity(function_metrics)
                }
            }
        }

    def _calculate_group_complexity(self, function_metrics: Dict) -> Dict:
        """Calculate complexity metrics for each functional group"""
        group_complexity = {}
        for group, functions in function_metrics['groups'].items():
            group_data = {
                'total_cyclomatic': 0,
                'total_cognitive': 0,
                'average_complexity': 0,
                'function_count': len(functions)
            }
            
            for func_name in functions:
                if func_name in function_metrics['functions']:
                    metrics = function_metrics['functions'][func_name]['metrics']
                    group_data['total_cyclomatic'] += metrics['cyclomatic_complexity']
                    group_data['total_cognitive'] += metrics['cognitive_complexity']
            
            if group_data['function_count'] > 0:
                group_data['average_complexity'] = (
                    group_data['total_cyclomatic'] / group_data['function_count']
                )
                
            group_complexity[group] = group_data
        
        return group_complexity
    
    

def main():
    project_backend = r"C:\Users\md8w7\OneDrive University of Missouri\Desktop\ImportantFiles\Milestone4\backend"
    analyzer = BackendAnalyzer(project_backend)
    results = analyzer.analyze_project()
    
    print(f"Analysis complete. Results saved to {project_backend}/a_backend_project_analyzer.json")
    print("\nSummary:")
    print(f"Files analyzed: {len(results['files'])}")
    print(f"Warnings found: {len(results['warnings'])}")
    print(f"Insights generated: {len(results['insights'])}")

if __name__ == "__main__":
    main()
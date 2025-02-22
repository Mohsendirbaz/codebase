"""Enhanced function analyzer with complexity metrics, functional grouping, and pattern analysis"""
import os
import ast
from typing import Dict, List, Tuple, Set
from collections import defaultdict
import pandas as pd
from pathlib import Path
from dataclasses import dataclass, field
from enum import Enum
import json
import networkx as nx
from itertools import combinations

class FunctionalGroup(Enum):
    DATA_PROCESSING = "data_processing"
    VISUALIZATION = "visualization"
    CONFIGURATION = "configuration"
    UTILITY = "utility"
    ANALYSIS = "analysis"
    API = "api"
    
@dataclass
class FunctionMetrics:
    cyclomatic_complexity: int = 0
    cognitive_complexity: int = 0
    lines_of_code: int = 0
    parameter_count: int = 0
    return_count: int = 0
    dependency_count: int = 0
    variable_patterns: Dict[str, int] = field(default_factory=dict)
    call_patterns: Dict[str, int] = field(default_factory=dict)
    control_flow_patterns: Dict[str, int] = field(default_factory=dict)
    similarity_score: float = 0.0

@dataclass
class CodePattern:
    variable_usage: Dict[str, int]
    call_sequence: List[str]
    control_structures: Dict[str, int]
    parameter_types: Set[str]
    return_types: Set[str]
    
class FunctionProfile:
    def __init__(self, name: str, source: str, group: FunctionalGroup):
        self.name = name
        self.source = source
        self.group = group
        self.metrics = None
        self.docstring = ""
        self.dependencies = set()
        self.callers = set()
        self.pattern = None
        self.similar_functions = []
        
    def add_dependency(self, function_name: str):
        self.dependencies.add(function_name)
        
    def add_caller(self, function_name: str):
        self.callers.add(function_name)
        
    def set_pattern(self, pattern: CodePattern):
        self.pattern = pattern

class FunctionAnalyzer:
    def __init__(self):
        self.functions = {}  # name -> FunctionProfile
        self.groups = defaultdict(list)
        self.similarity_threshold = 0.7
        self.dependency_graph = nx.DiGraph()
        
    def calculate_cognitive_complexity(self, node: ast.AST) -> int:
        complexity = 0
        nesting = 0
        
        for child in ast.walk(node):
            if isinstance(child, (ast.If, ast.While, ast.For)):
                complexity += (1 + nesting)
                nesting += 1
            elif isinstance(child, ast.Try):
                complexity += (1 + nesting)
            elif isinstance(child, (ast.And, ast.Or)):
                complexity += 1
                
        return complexity

    def calculate_cyclomatic_complexity(self, node: ast.AST) -> int:
        complexity = 1
        
        for child in ast.walk(node):
            if isinstance(child, (ast.If, ast.While, ast.For, ast.ExceptHandler)):
                complexity += 1
            elif isinstance(child, (ast.Assert, ast.Raise)):
                complexity += 1
            elif isinstance(child, (ast.And, ast.Or)):
                complexity += 1
                
        return complexity

    def extract_code_pattern(self, node: ast.FunctionDef) -> CodePattern:
        """Extract detailed code patterns from a function"""
        variable_usage = defaultdict(int)
        call_sequence = []
        control_structures = defaultdict(int)
        parameter_types = set()
        return_types = set()
        
        # Track variable usage
        for child in ast.walk(node):
            if isinstance(child, ast.Name):
                variable_usage[child.id] += 1
                
            # Track function calls
            elif isinstance(child, ast.Call):
                if isinstance(child.func, ast.Name):
                    call_sequence.append(child.func.id)
                    
            # Track control structures
            elif isinstance(child, ast.If):
                control_structures['if'] += 1
            elif isinstance(child, ast.For):
                control_structures['for'] += 1
            elif isinstance(child, ast.While):
                control_structures['while'] += 1
            elif isinstance(child, ast.Try):
                control_structures['try'] += 1
                
            # Track parameter and return types
            elif isinstance(child, ast.arg):
                if child.annotation:
                    parameter_types.add(ast.unparse(child.annotation))
            elif isinstance(child, ast.Return):
                if child.value:
                    return_types.add(type(child.value).__name__)
                    
        return CodePattern(
            variable_usage=dict(variable_usage),
            call_sequence=call_sequence,
            control_structures=dict(control_structures),
            parameter_types=parameter_types,
            return_types=return_types
        )

    def calculate_pattern_similarity(self, pattern1: CodePattern, pattern2: CodePattern) -> float:
        """Calculate similarity score between two code patterns"""
        scores = []
        
        # Compare variable usage patterns
        var_intersection = set(pattern1.variable_usage) & set(pattern2.variable_usage)
        var_union = set(pattern1.variable_usage) | set(pattern2.variable_usage)
        scores.append(len(var_intersection) / len(var_union) if var_union else 1.0)
        
        # Compare call sequences
        call_similarity = self._sequence_similarity(pattern1.call_sequence, pattern2.call_sequence)
        scores.append(call_similarity)
        
        # Compare control structure usage
        control_similarity = self._dict_similarity(pattern1.control_structures, pattern2.control_structures)
        scores.append(control_similarity)
        
        # Compare parameter and return types
        type_similarity = (
            len(pattern1.parameter_types & pattern2.parameter_types) / 
            len(pattern1.parameter_types | pattern2.parameter_types)
            if (pattern1.parameter_types | pattern2.parameter_types) else 1.0
        )
        scores.append(type_similarity)
        
        return sum(scores) / len(scores)

    def _sequence_similarity(self, seq1: List[str], seq2: List[str]) -> float:
        """Calculate similarity between two sequences"""
        if not seq1 and not seq2:
            return 1.0
        if not seq1 or not seq2:
            return 0.0
            
        # Use longest common subsequence
        matrix = [[0] * (len(seq2) + 1) for _ in range(len(seq1) + 1)]
        
        for i in range(1, len(seq1) + 1):
            for j in range(1, len(seq2) + 1):
                if seq1[i-1] == seq2[j-1]:
                    matrix[i][j] = matrix[i-1][j-1] + 1
                else:
                    matrix[i][j] = max(matrix[i-1][j], matrix[i][j-1])
                    
        lcs_length = matrix[-1][-1]
        return 2 * lcs_length / (len(seq1) + len(seq2))

    def _dict_similarity(self, dict1: Dict, dict2: Dict) -> float:
        """Calculate similarity between two dictionaries"""
        keys = set(dict1) | set(dict2)
        if not keys:
            return 1.0
            
        differences = sum(abs(dict1.get(k, 0) - dict2.get(k, 0)) for k in keys)
        max_possible = sum(max(dict1.get(k, 0), dict2.get(k, 0)) for k in keys)
        
        return 1 - (differences / (2 * max_possible)) if max_possible else 1.0

    def analyze_function(self, node: ast.FunctionDef, source: str) -> FunctionProfile:
        """Analyze a single function node"""
        group = self._determine_group(node)
        profile = FunctionProfile(node.name, source, group)
        profile.docstring = ast.get_docstring(node) or ""
        
        # Extract code patterns
        pattern = self.extract_code_pattern(node)
        profile.set_pattern(pattern)
        
        # Calculate metrics
        profile.metrics = FunctionMetrics(
            cyclomatic_complexity=self.calculate_cyclomatic_complexity(node),
            cognitive_complexity=self.calculate_cognitive_complexity(node),
            lines_of_code=len(node.body),
            parameter_count=len(node.args.args),
            return_count=sum(1 for n in ast.walk(node) if isinstance(n, ast.Return)),
            variable_patterns=pattern.variable_usage,
            call_patterns=dict(enumerate(pattern.call_sequence)),
            control_flow_patterns=pattern.control_structures
        )
        
        return profile

    def _determine_group(self, node: ast.FunctionDef) -> FunctionalGroup:
        """Determine the functional group of a function based on its characteristics"""
        name = node.name.lower()
        code = ast.unparse(node)
        
        if any(kw in name for kw in ['process', 'transform', 'convert']):
            return FunctionalGroup.DATA_PROCESSING
        elif any(kw in name for kw in ['plot', 'chart', 'graph', 'display']):
            return FunctionalGroup.VISUALIZATION
        elif any(kw in name for kw in ['config', 'setup', 'init']):
            return FunctionalGroup.CONFIGURATION
        elif any(kw in name for kw in ['calculate', 'compute', 'analyze']):
            return FunctionalGroup.ANALYSIS
        elif any(kw in name for kw in ['api', 'endpoint', 'route']):
            return FunctionalGroup.API
        else:
            return FunctionalGroup.UTILITY

    def find_similar_functions(self):
        """Identify similar functions based on code patterns"""
        for func1, func2 in combinations(self.functions.values(), 2):
            if func1.pattern and func2.pattern:
                similarity = self.calculate_pattern_similarity(func1.pattern, func2.pattern)
                if similarity >= self.similarity_threshold:
                    func1.similar_functions.append((func2.name, similarity))
                    func2.similar_functions.append((func1.name, similarity))

    def analyze_directory(self, directory: Path) -> Dict:
        """Analyze all Python files in a directory"""
        for file_path in directory.rglob('*.py'):
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    tree = ast.parse(f.read())
                    
                for node in ast.walk(tree):
                    if isinstance(node, ast.FunctionDef):
                        profile = self.analyze_function(node, str(file_path))
                        self.functions[node.name] = profile
                        self.groups[profile.group].append(profile)
                        
            except Exception as e:
                print(f"Error processing {file_path}: {e}")

        # Analyze dependencies and similarities
        self._analyze_dependencies()
        self.find_similar_functions()
        
        return self._generate_analysis_results()

    def _analyze_dependencies(self):
        """Analyze function dependencies and update metrics"""
        for func_name, profile in self.functions.items():
            try:
                with open(profile.source, 'r', encoding='utf-8') as f:
                    tree = ast.parse(f.read())
                    
                for node in ast.walk(tree):
                    if isinstance(node, ast.FunctionDef) and node.name == func_name:
                        for call in ast.walk(node):
                            if isinstance(call, ast.Call) and isinstance(call.func, ast.Name):
                                called_func = call.func.id
                                if called_func in self.functions and called_func != func_name:
                                    profile.add_dependency(called_func)
                                    self.functions[called_func].add_caller(func_name)
                                    self.dependency_graph.add_edge(func_name, called_func)
                                    
            except Exception as e:
                print(f"Warning: Could not analyze dependencies for {func_name}: {e}")
            
            profile.metrics.dependency_count = len(profile.dependencies)

    def _generate_analysis_results(self) -> Dict:
        """Generate analysis results with enhanced metrics and patterns"""
        results = {
            'timestamp': pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S'),
            'metrics': {
                'complexity': {
                    'cyclomatic': sum(f.metrics.cyclomatic_complexity for f in self.functions.values()),
                    'cognitive': sum(f.metrics.cognitive_complexity for f in self.functions.values()),
                    'dependencies': sum(f.metrics.dependency_count for f in self.functions.values())
                },
                'size': {
                    'total_functions': len(self.functions),
                    'groups': {group.value: len(funcs) for group, funcs in self.groups.items()}
                }
            },
            'functions': {
                name: {
                    'metrics': vars(profile.metrics),
                    'group': profile.group.value,
                    'source': profile.source,
                    'dependencies': list(profile.dependencies),
                    'callers': list(profile.callers),
                    'similar_functions': profile.similar_functions,
                    'pattern_summary': {
                        'variable_count': len(profile.pattern.variable_usage),
                        'call_sequence_length': len(profile.pattern.call_sequence),
                        'control_structure_types': list(profile.pattern.control_structures.keys())
                    } if profile.pattern else {}
                }
                for name, profile in self.functions.items()
            },
            'groups': {
                group.value: [f.name for f in funcs]
                for group, funcs in self.groups.items()
            },
            'refactoring_opportunities': self._identify_refactoring_opportunities()
        }
        
        return results

    def _identify_refactoring_opportunities(self) -> List[Dict]:
        """Identify specific refactoring opportunities"""
        opportunities = []
        
        # Find clusters of similar functions
        similar_clusters = self._find_function_clusters()
        for cluster in similar_clusters:
            if len(cluster) >= 2:
                opportunities.append({
                    'type': 'consolidation',
                    'functions': list(cluster),
                    'reason': 'Similar functionality detected'
                })
        
        # Identify complex functions that could be split
        for name, profile in self.functions.items():
            if profile.metrics.cognitive_complexity > 15:
                opportunities.append({
                    'type': 'split',
                    'function': name,
                    'reason': 'High cognitive complexity'
                })
        
        # Find circular dependencies
        try:
            cycles = list(nx.simple_cycles(self.dependency_graph))
            for cycle in cycles:
                opportunities.append({
                    'type': 'dependency_cycle',
                    'functions': cycle,
                    'reason': 'Circular dependency detected'
                })
        except nx.NetworkXError:
            pass
        
        return opportunities

    def _find_function_clusters(self) -> List[Set[str]]:
        """Find clusters of similar functions"""
        clusters = []
        processed = set()
        
        for func_name, profile in self.functions.items():
            if func_name in processed:
                continue
                
            cluster = {func_name}
            if profile.similar_functions:
                for similar_func, score in profile.similar_functions:
                    if score >= self.similarity_threshold:
                        cluster.add(similar_func)
                        processed.add(similar_func)
                        
            if len(cluster) > 1:
                clusters.append(cluster)
            processed.add(func_name)
            
        return clusters


def main():
    """Main function to run the function analysis and save results"""
    try:
        # Get the project root directory
        project_root = Path.cwd()  # Current working directory
        
        # Initialize and run the analyzer
        analyzer = FunctionAnalyzer()
        results = analyzer.analyze_directory(project_root)
        
        # Prepare output file path
        output_path = project_root/'backend' / 'd_function_collection.json'
        
        # Save results to JSON with proper formatting
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=4, sort_keys=True)
        
        # Print summary statistics
        print(f"\nAnalysis complete. Results saved to: {output_path}")
        print(f"Total functions analyzed: {len(results['functions'])}")
        print("\nFunction groups:")
        for group, count in results['metrics']['size']['groups'].items():
            print(f"  {group}: {count} functions")
        print(f"\nRefactoring opportunities identified: {len(results['refactoring_opportunities'])}")
        print("\nMost significant opportunities:")
        for opp in results['refactoring_opportunities'][:3]:
            print(f"  - {opp['type']}: {opp['reason']}")
        
    except Exception as e:
        print(f"Error during analysis: {str(e)}")
        raise

if __name__ == "__main__":
    main()
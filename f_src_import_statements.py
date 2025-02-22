import os
import re
import json
import pandas as pd
from pathlib import Path
from typing import Dict, List, Set, Tuple, Optional
from dataclasses import dataclass
from datetime import datetime

@dataclass
class AnalysisConfig:
    """Configuration settings for project analysis"""
    src_dir: str
    output_dir: str
    version_control_file: str = "version_control.json"
    
    # Analysis settings
    analyze_relative_paths: bool = True
    analyze_css_imports: bool = True
    analyze_component_imports: bool = True
    suggest_path_optimizations: bool = True
    
    # Report generation settings
    generate_component_map: bool = True
    generate_style_map: bool = True
    generate_optimization_report: bool = True
    
    @staticmethod
    def create_default():
        """Create a default configuration instance"""
        base_path = Path.cwd()
        return AnalysisConfig(
            src_dir=str(base_path / "src"),
            output_dir=str(base_path / "f_src_import_statements")
        )

@dataclass
class FileAnalysis:
    """Structure for storing file analysis results"""
    file_path: str
    imports: List[str]
    relative_imports: List[str]
    absolute_imports: List[str]
    css_imports: List[str]
    component_imports: List[str]
    dependencies: List[str]

class ProjectAnalyzer:
    """Analyzer for project structure and relationships"""
    
    def __init__(self, config: AnalysisConfig):
        self.config = config
        self.root_dir = Path(config.src_dir)
        self.output_dir = Path(config.output_dir)
        self.analysis_results: Dict[str, FileAnalysis] = {}
        self.project_structure: Dict = {}
        self.version_control_path = self.output_dir / config.version_control_file
        os.makedirs(self.output_dir, exist_ok=True)

    def analyze_project(self) -> None:
        """Execute the complete project analysis process with version control."""
        # Load previous version control data if it exists
        previous_analysis = self._load_previous_analysis()
        
        # Perform current analysis
        self._scan_directory()
        self._analyze_imports()
        
        # Generate or update reports
        self._generate_project_structure(previous_analysis)
        
        if self.config.generate_component_map:
            self._generate_component_map()
        if self.config.generate_style_map:
            self._generate_style_map()
        if self.config.generate_optimization_report:
            self._generate_optimization_report()

    def _load_previous_analysis(self) -> Optional[Dict]:
        """Load previous analysis data from version control file."""
        try:
            if self.version_control_path.exists():
                with open(self.version_control_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
        except Exception as e:
            print(f"Error loading previous analysis: {str(e)}")
        return None

    def analyze_file_content(self, content: str) -> List[str]:
        """Analyze first 52 lines of file content for import statements."""
        import_statements = []
        lines = content.split('\n')[:52]

        for line in lines:
            line_lower = line.lower()
            if 'import' in line_lower and 'from' in line_lower:
                cleaned_line = line.strip()
                if cleaned_line.endswith(';'):
                    cleaned_line = cleaned_line[:-1].strip()
                import_statements.append(cleaned_line)

        return import_statements

    def _scan_directory(self) -> None:
        """Scan the project directory for all relevant files."""
        extensions = {'.js', '.jsx', '.ts', '.tsx', '.scss', '.less'}
        
        for file_path in self.root_dir.rglob('*'):
            if file_path.suffix in extensions:
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    rel_path = file_path.relative_to(self.root_dir)
                    import_statements = self.analyze_file_content(content)
                    
                    self.project_structure[str(rel_path)] = {
                        'type': file_path.suffix,
                        'directory': str(rel_path.parent),
                        'name': file_path.name,
                        'content': content,
                        'imports': import_statements
                    }
                except Exception as e:
                    print(f"Error reading file {file_path}: {str(e)}")

    def _extract_imports(self, content: str) -> Tuple[List[str], List[str], List[str], List[str]]:
        """Extract different types of imports from file content."""
        import_pattern = r'import\s+(?:{[^}]+}|\w+)\s+from\s+[\'"]([^\'"]+)[\'"]'
        require_pattern = r'require\([\'"]([^\'"]+)[\'"]\)'
        css_import_pattern = r'import\s+[\'"]([^\'"]+\.css)[\'"]'
        
        imports = re.findall(import_pattern, content)
        requires = re.findall(require_pattern, content)
        css_imports = re.findall(css_import_pattern, content)
        
        all_imports = imports + requires
        relative_imports = [imp for imp in all_imports if imp.startswith('.')]
        absolute_imports = [imp for imp in all_imports if not imp.startswith('.')]
        
        return all_imports, relative_imports, absolute_imports, css_imports

    def _analyze_imports(self) -> None:
        """Analyze imports for all JavaScript/TypeScript files."""
        for file_path, info in self.project_structure.items():
            if info['type'] in {'.js', '.jsx', '.ts', '.tsx'}:
                all_imports, relative_imports, absolute_imports, css_imports = self._extract_imports(info['content'])
                
                component_imports = [imp for imp in all_imports 
                                  if any(ext in imp for ext in ['.js', '.jsx', '.ts', '.tsx'])]
                
                self.analysis_results[file_path] = FileAnalysis(
                    file_path=file_path,
                    imports=all_imports,
                    relative_imports=relative_imports,
                    absolute_imports=absolute_imports,
                    css_imports=css_imports,
                    component_imports=component_imports,
                    dependencies=self._resolve_dependencies(file_path, relative_imports)
                )

    def _resolve_dependencies(self, file_path: str, imports: List[str]) -> List[str]:
        """Resolve relative import paths to absolute project paths."""
        base_dir = Path(file_path).parent
        resolved = []
        for imp in imports:
            try:
                resolved_path = str((base_dir / imp).resolve().relative_to(self.root_dir))
                resolved.append(resolved_path)
            except Exception:
                continue
        return resolved

    def _compare_analyses(self, previous: Dict, current: Dict) -> Dict:
        """Compare previous and current analyses to identify changes."""
        previous_files = set(previous.get('files', {}).keys())
        current_files = set(current.get('files', {}).keys())
        
        changes = {
            'added_files': list(current_files - previous_files),
            'removed_files': list(previous_files - current_files),
            'modified_files': [],
            'import_changes': []
        }
        
        # Check for modified files
        common_files = previous_files & current_files
        for file in common_files:
            prev_imports = set(previous['files'][file].get('imports', []))
            curr_imports = set(current['files'][file].get('imports', []))
            
            if prev_imports != curr_imports:
                changes['modified_files'].append(file)
                changes['import_changes'].append({
                    'file': file,
                    'added_imports': list(curr_imports - prev_imports),
                    'removed_imports': list(prev_imports - curr_imports)
                })
        
        return changes

    def _generate_project_structure(self, previous_analysis: Optional[Dict]) -> None:
        """Generate project structure report with version control."""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        structure = {
            'project_name': self.root_dir.name,
            'analysis_date': timestamp,
            'version': 1,
            'directories': {},
            'files': {}
        }
        
        # Build current structure
        for file_path, info in self.project_structure.items():
            if info['imports']:
                structure['files'][file_path] = {
                    'type': info['type'],
                    'directory': info['directory'],
                    'imports': info['imports']
                }
                
                dir_path = str(Path(file_path).parent)
                if dir_path not in structure['directories']:
                    structure['directories'][dir_path] = {
                        'files': [],
                        'import_count': 0
                    }
                structure['directories'][dir_path]['files'].append(file_path)
                structure['directories'][dir_path]['import_count'] += len(info['imports'])
        
        # Handle version control
        if previous_analysis:
            structure['version'] = previous_analysis.get('version', 0) + 1
            changes = self._compare_analyses(previous_analysis, structure)
            structure['changes'] = changes
            
            # Write detailed change log
            change_log_path = self.output_dir / f'change_log_{datetime.now().strftime("%Y%m%d_%H%M")}.md'
            self._write_change_log(changes, change_log_path)
        
        # Always update the main version control file
        with open(self.version_control_path, 'w', encoding='utf-8') as f:
            json.dump(structure, f, indent=2)
        
        print(f"Project structure updated: {self.version_control_path}")

    def _write_change_log(self, changes: Dict, log_path: Path) -> None:
        """Write a detailed change log in Markdown format."""
        with open(log_path, 'w', encoding='utf-8') as f:
            f.write(f"# Project Structure Changes\n\n")
            f.write(f"Analysis Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            
            if changes['added_files']:
                f.write("## Added Files\n\n")
                for file in changes['added_files']:
                    f.write(f"- {file}\n")
                f.write("\n")
            
            if changes['removed_files']:
                f.write("## Removed Files\n\n")
                for file in changes['removed_files']:
                    f.write(f"- {file}\n")
                f.write("\n")
            
            if changes['import_changes']:
                f.write("## Modified Files\n\n")
                for change in changes['import_changes']:
                    f.write(f"### {change['file']}\n\n")
                    if change['added_imports']:
                        f.write("Added imports:\n")
                        for imp in change['added_imports']:
                            f.write(f"- {imp}\n")
                    if change['removed_imports']:
                        f.write("\nRemoved imports:\n")
                        for imp in change['removed_imports']:
                            f.write(f"- {imp}\n")
                    f.write("\n")

    def _generate_component_map(self) -> None:
        """Generate component relationship map."""
        output_path = self.output_dir / 'component_relationships.csv'
        
        relationships = []
        for file_path, analysis in self.analysis_results.items():
            for dep in analysis.dependencies:
                relationships.append({
                    'Source': file_path,
                    'Target': dep,
                    'Type': 'Component Import'
                })
        
        df = pd.DataFrame(relationships)
        df.to_csv(output_path, index=False, mode='w')

    def _generate_style_map(self) -> None:
        """Generate stylesheet relationship map."""
        output_path = self.output_dir / 'style_relationships.csv'
        
        style_relationships = []
        for file_path, analysis in self.analysis_results.items():
            for css in analysis.css_imports:
                style_relationships.append({
                    'Component': file_path,
                    'Stylesheet': css,
                    'Type': 'CSS Import'
                })
        
        df = pd.DataFrame(style_relationships)
        df.to_csv(output_path, index=False, mode='w')

    def _generate_optimization_report(self) -> None:
        """Generate path optimization suggestions report."""
        output_path = self.output_dir / 'path_optimization.md'
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write("# Path Optimization Suggestions\n\n")
            
            for file_path, analysis in self.analysis_results.items():
                if analysis.relative_imports:
                    f.write(f"## {file_path}\n\n")
                    for imp in analysis.relative_imports:
                        if imp.count('../') > 2:
                            f.write(f"- Consider using absolute import for: {imp}\n")
                            resolved = self._resolve_dependencies(file_path, [imp])[0]
                            f.write(f"  - Suggested: '{resolved}'\n")
                    f.write("\n")

def main():
    """Main execution function"""
    config = AnalysisConfig.create_default()
    analyzer = ProjectAnalyzer(config)
    analyzer.analyze_project()

if __name__ == "__main__":
    main()
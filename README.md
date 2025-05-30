# TEA Space - Advanced Techno-Economic Analysis Platform

<div align="center">
  <img src="https://img.shields.io/badge/React-18.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React">
  <img src="https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License">
  <img src="https://img.shields.io/badge/AI-GPT--4-412991?style=for-the-badge&logo=openai&logoColor=white" alt="AI">
</div>

## 🌟 Overview

TEA Space is a cutting-edge techno-economic analysis platform that revolutionizes process economics evaluation through innovative matrix-based architecture, advanced environmental intelligence, and AI-powered assistance. Designed for industrial and chemical process optimization, TEA Space uniquely combines financial modeling with carbon tracking and regulatory compliance.

### 🎯 Key Features

• **Advanced Financial Modeling Engine**: Built a comprehensive Cash Flow Analysis (CFA) system with modular revenue/expense component tracking, supporting complex industrial process economics with time-sensitive parameter activation through the proprietary Efficacy Time System.

• **Multi-dimensional Parameter Management**: Engineered a unified matrix state management system that treats all parameters as elements in a 5-dimensional space (versions, zones, time periods, configurations, and capacity), enabling powerful cross-dimensional comparisons and inheritance patterns with theoretical capacity handling up to 900,000 configurations.

• **Comprehensive Climate Intelligence Module**: Implemented multi-dimensional carbon tracking across Scope 1, 2, and 3 emissions with configurable emission factors for equipment, installation, materials, energy, and transportation. Features specialized tracking for hard-to-decarbonize sectors (steel, cement, chemicals) with interactive geospatial visualization using heatmaps, bubble charts, and gradient overlays.

• **Three-Tier Regulatory Compliance Framework**: Developed multilevel emissions treatment supporting local (municipal), state (regional), and federal (national) regulatory thresholds with automatic compliance status monitoring (compliant/warning/non-compliant) and region-specific incentive integration including carbon tax rebates and emissions trading benefits.

• **AI-Powered Factual Precedence System**: Integrated GPT-4 Turbo to provide context-aware historical business insights and parameter recommendations based on industry type, technology level, scale, and regulatory framework. The system analyzes corporate evolution patterns from companies like Tesla and Toyota to suggest phased deployment strategies, partnerships, and value-based pricing approaches.

• **Intelligent Virtual Assistant for Modelers**: Built the Junie Connector Plugin providing inline AI-powered suggestions directly in the IDE, featuring sequential agent architecture with isolated contexts, ghost text suggestions, and asynchronous execution for seamless modeling assistance without disrupting workflow.

• **Decarbonization Pathway Analysis**: Created a comprehensive pathway comparison system evaluating 8 pre-configured hydrogen production methods (renewable, low-carbon, fossil, emerging) with metrics including carbon intensity (1.2-18.2 kg CO2e/kg H2), technology readiness levels, water usage, and cost analysis, enabling side-by-side comparison of up to 4 pathways.

• **Comprehensive Sensitivity Analysis Suite**: Implemented multiple sensitivity testing modes including percentage variation, direct value modification, absolute departure analysis, and Monte Carlo simulations, all orchestrated through a sequential event processing system ensuring proper workflow execution.

• **Interactive Visualization Framework**: Developed dynamic visualization capabilities using React/D3.js for real-time rendering of waterfall charts, operational cost breakdowns, cumulative economic summaries, capacity utilization tracking, and climate impact overlays with weighted calculations across all dimensions.

• **Scalable Architecture with Environmental Focus**: Designed a modular full-stack solution using React.js with Jotai state management, Python Flask APIs with factory-based calculation engines, dual database integration (PostgreSQL/ClickHouse), and blockchain-ready architecture for future carbon credit tracking and immutable compliance records.

• **Enterprise Environmental Features**: Incorporated multi-zone carbon generation with clustering analysis, regional system support (SI/USD and Europe/EUR), dynamic carbon incentive calculations, and machine learning readiness for predictive emissions modeling and optimization recommendations.

## 🚀 Getting Started

### Prerequisites

- Node.js v16.0+ 
- Python 3.9+
- PostgreSQL 14+
- ClickHouse (optional for analytics)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/tea-space.git
   cd tea-space
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

4. **Initialize databases**
   ```bash
   python backend/database/initialize_databases.py
   ```

5. **Start the application**
   ```bash
   # Terminal 1 - Backend
   python server.py

   # Terminal 2 - Frontend
   npm start
   ```

## 🏗️ Architecture

### Frontend Stack
- **React 18.2** with functional components
- **Jotai** for atomic state management
- **Ant Design** for UI components
- **D3.js** for data visualizations
- **React Router** for navigation

### Backend Stack
- **Flask** API framework
- **PostgreSQL** for relational data
- **ClickHouse** for time-series analytics
- **Modular calculation engines**
- **Factory pattern architecture**

### AI Integration
- **GPT-4 Turbo** for factual precedence
- **Sequential agent architecture**
- **Rate-limited queue system**
- **Context-aware recommendations**

## 📊 Core Modules

### 1. Financial Modeling Engine
- Cash Flow Analysis (CFA) with modular components
- Revenue/expense tracking with time-sensitive activation
- Tax operations and utility calculations
- Multi-version configuration management

### 2. Climate Intelligence Module
```javascript
// Example: Track emissions across zones
const emissionFactors = {
  equipment: 2.5,
  installation: 1.2,
  materials: 3.8,
  energy: 4.5,
  transportation: 5.2
};
```

### 3. Sensitivity Analysis Suite
- Percentage variation
- Direct value modification
- Absolute departure analysis
- Monte Carlo simulations

### 4. Decarbonization Pathways
- Wind-PEM, Solar-PEM, Biomass-PEM
- Natural gas with/without CCS
- Coal with/without CCS
- Emerging technologies (Solid Oxide)

## 🤖 AI-Powered Features

### Factual Precedence System
The platform provides context-aware business insights based on:
- Industry type and technology level
- Corporate evolution patterns (Tesla, Toyota, Amazon)
- Regulatory framework considerations
- Phased deployment strategies

### Virtual Assistant (Junie Plugin)
- Inline code suggestions in IDE
- Ghost text recommendations
- Asynchronous background processing
- Context isolation for focused assistance

## 🌍 Environmental Compliance

### Emission Thresholds
| Level | Threshold | Status |
|-------|-----------|--------|
| Local | < 1,000 kg CO₂e | Compliant |
| State | < 10,000 kg CO₂e | Warning at 80% |
| Federal | < 25,000 kg CO₂e | Non-compliant if exceeded |

### Regional Systems
- **SI/USD**: Standard international metrics
- **EUR**: EU-specific regulations and incentives

## 📈 Visualization Capabilities

- **Waterfall Charts** - Financial flow analysis
- **Heatmaps** - Geographic emission distribution
- **Bubble Charts** - Multi-dimensional comparisons
- **Capacity Tracking** - Real-time utilization metrics

## 🛠️ Development Tools

### Code Analysis
```bash
# Find large files for refactoring
python find_large_files.py

# Analyze source directory
python find_large_src_files.py
```

### Testing
```bash
# Run unit tests
npm test

# Run backend tests
pytest backend/tests/
```

## 📚 Documentation

- [API Documentation](./docs/api.md)
- [Component Guide](./docs/components.md)
- [Climate Module Guide](./docs/climate-module.md)
- [AI Integration Guide](./docs/ai-integration.md)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for GPT-4 integration capabilities
- React and Python communities
- Contributors to open-source dependencies

## 📞 Contact & Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/tea-space/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/tea-space/discussions)
- **Email**: support@teaspace.com

---

<div align="center">
  <p>Built with ❤️ for sustainable industrial transformation</p>
  <p>© 2025 TEA Space. Making complex economics simple, sustainable, and intelligent.</p>
</div>

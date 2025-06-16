import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Slider, 
  InputNumber, 
  Row, 
  Col, 
  Divider, 
  Progress, 
  Tooltip, 
  Switch, 
  Table,
  Button,
  Alert 
} from 'antd';
import { 
  InfoCircleOutlined, 
  SettingOutlined, 
  LineChartOutlined,
  WarningOutlined,
  PieChartOutlined,
  AreaChartOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

/**
 * CapacityMapPanel component for displaying and configuring application capacity usage
 */
const CapacityMapPanel = ({ 
  currentState, 
  onCapacityConfigChange,
  onClose 
}) => {
  // Default capacity configuration
  const defaultCapacityConfig = {
    maxValues: {
      parameters: 75,           // S10-S84
      scalingGroups: 5,         // Per parameter
      sensitivityVariations: 6, // Per parameter-scaling group combination
      versions: 20,
      years: 20                 // Plant lifetime
    },
    weights: {
      parameters: 4,
      scalingGroups: 5,
      sensitivityVariations: 3,
      versions: 3,
      years: 4
    }
  };

  // Current capacity configuration state
  const [capacityConfig, setCapacityConfig] = useState(defaultCapacityConfig);
  
  // Derived usage metrics state
  const [usageMetrics, setUsageMetrics] = useState(null);
  
  // UI controls state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Update usage metrics when current state or capacity config changes
  useEffect(() => {
    if (currentState) {
      const metrics = calculateUsageMetrics(currentState, capacityConfig);
      setUsageMetrics(metrics);
    }
  }, [currentState, capacityConfig]);

  /**
   * Calculate usage metrics based on current state and capacity configuration
   */
  const calculateUsageMetrics = (currentState, capacityConfig) => {
    // Extract used values from current state
    const { 
      usedParameters = 50,
      scalingGroupsPerParameter = {},
      variationsPerParameterScalingGroup = {},
      usedVersions = 8,
      yearsConfigured = 15
    } = currentState;
    
    // Calculate total scaling groups used
    const totalScalingGroupsUsed = Object.values(scalingGroupsPerParameter).reduce(
      (sum, count) => sum + count, 
      0
    ) || usedParameters * 3; // Fallback to average 3 if data not available
    
    // Calculate total variations used
    const totalVariationsUsed = Object.values(variationsPerParameterScalingGroup).reduce(
      (sum, count) => sum + count, 
      0
    ) || totalScalingGroupsUsed * 4; // Fallback to average 4 if data not available
    
    // Theoretical maximum capacities
    const maxParameterScalingGroups = usedParameters * capacityConfig.maxValues.scalingGroups;
    const maxParameterScalingGroupVariations = maxParameterScalingGroups * capacityConfig.maxValues.sensitivityVariations;
    
    // Calculate local usage percentages
    const parameterUsage = usedParameters / capacityConfig.maxValues.parameters;
    
    const scalingGroupUsage = totalScalingGroupsUsed / maxParameterScalingGroups;
    
    const variationUsage = totalVariationsUsed / maxParameterScalingGroupVariations;
    
    const versionUsage = usedVersions / capacityConfig.maxValues.versions;
    
    const temporalUsage = yearsConfigured / capacityConfig.maxValues.years;
    
    // Calculate theoretical total capacity
    const theoreticalTotalCapacity = capacityConfig.maxValues.parameters *
                                    capacityConfig.maxValues.scalingGroups *
                                    capacityConfig.maxValues.sensitivityVariations *
                                    capacityConfig.maxValues.years *
                                    capacityConfig.maxValues.versions;
    
    // Calculate actual used capacity
    const actualUsedCapacity = usedParameters *
                              totalScalingGroupsUsed / usedParameters * // average scaling groups per parameter
                              totalVariationsUsed / totalScalingGroupsUsed * // average variations per scaling group
                              yearsConfigured *
                              usedVersions;
    
    // Calculate total capacity usage
    const totalCapacityUsage = actualUsedCapacity / theoreticalTotalCapacity;
    
    // Category aggregation
    const configCapacity = weightedAverage(
      [parameterUsage, scalingGroupUsage, variationUsage],
      [
        capacityConfig.weights.parameters, 
        capacityConfig.weights.scalingGroups,
        capacityConfig.weights.sensitivityVariations
      ]
    );
    
    const temporalCapacity = weightedAverage(
      [versionUsage, temporalUsage],
      [capacityConfig.weights.versions, capacityConfig.weights.years]
    );
    
    // Global aggregation
    const globalUsage = weightedAverage(
      [parameterUsage, scalingGroupUsage, variationUsage, versionUsage, temporalUsage],
      [
        capacityConfig.weights.parameters, 
        capacityConfig.weights.scalingGroups,
        capacityConfig.weights.sensitivityVariations,
        capacityConfig.weights.versions,
        capacityConfig.weights.years
      ]
    );
    
    return {
      local: {
        parameterUsage: Math.round(parameterUsage * 100),
        scalingGroupUsage: Math.round(scalingGroupUsage * 100),
        variationUsage: Math.round(variationUsage * 100),
        versionUsage: Math.round(versionUsage * 100),
        temporalUsage: Math.round(temporalUsage * 100)
      },
      category: {
        configCapacity: Math.round(configCapacity * 100),
        temporalCapacity: Math.round(temporalCapacity * 100)
      },
      global: Math.round(globalUsage * 100),
      totalCapacity: {
        theoretical: theoreticalTotalCapacity,
        used: actualUsedCapacity,
        percentage: Math.round(totalCapacityUsage * 100)
      },
      raw: {
        usedParameters,
        totalScalingGroupsUsed,
        totalVariationsUsed,
        usedVersions,
        yearsConfigured,
        maxParameterScalingGroups,
        maxParameterScalingGroupVariations
      }
    };
  };

  /**
   * Calculate weighted average of a set of values
   */
  const weightedAverage = (values, weights) => {
    const sum = values.reduce((acc, val, idx) => acc + val * weights[idx], 0);
    const weightSum = weights.reduce((acc, w) => acc + w, 0);
    return sum / weightSum;
  };

  /**
   * Handle capacity config change
   */
  const handleCapacityChange = (key, value) => {
    const updatedConfig = {
      ...capacityConfig,
      maxValues: {
        ...capacityConfig.maxValues,
        [key]: value
      }
    };
    
    setCapacityConfig(updatedConfig);
    
    if (onCapacityConfigChange) {
      onCapacityConfigChange(updatedConfig);
    }
  };

  /**
   * Handle weight config change
   */
  const handleWeightChange = (key, value) => {
    const updatedConfig = {
      ...capacityConfig,
      weights: {
        ...capacityConfig.weights,
        [key]: value
      }
    };
    
    setCapacityConfig(updatedConfig);
    
    if (onCapacityConfigChange) {
      onCapacityConfigChange(updatedConfig);
    }
  };

  /**
   * Reset to default configuration
   */
  const handleReset = () => {
    setCapacityConfig(defaultCapacityConfig);
    
    if (onCapacityConfigChange) {
      onCapacityConfigChange(defaultCapacityConfig);
    }
  };

  /**
   * Get status color based on usage percentage
   */
  const getStatusColor = (percentage) => {
    if (percentage < 50) return 'success';
    if (percentage < 80) return 'warning';
    return 'exception';
  };

  /**
   * Format large numbers with abbreviations
   */
  const formatLargeNumber = (num) => {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1) + 'B';
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  // If no metrics are available yet, show loading state
  if (!usageMetrics) {
    return <Card loading />;
  }

  // Configuration panel items
  const configItems = [
    {
      key: 'parameters',
      label: 'Max Parameters',
      value: capacityConfig.maxValues.parameters,
      min: 10,
      max: 100,
      description: 'Maximum number of parameters (S10-S84)',
      usageValue: usageMetrics.raw.usedParameters,
      usagePercent: usageMetrics.local.parameterUsage
    },
    {
      key: 'scalingGroups',
      label: 'Max Scaling Groups',
      value: capacityConfig.maxValues.scalingGroups,
      min: 1,
      max: 10,
      description: 'Maximum scaling groups per parameter',
      usageValue: Math.round(usageMetrics.raw.totalScalingGroupsUsed / usageMetrics.raw.usedParameters),
      usagePercent: usageMetrics.local.scalingGroupUsage
    },
    {
      key: 'sensitivityVariations',
      label: 'Max Sensitivity Variations',
      value: capacityConfig.maxValues.sensitivityVariations,
      min: 1,
      max: 12,
      description: 'Maximum sensitivity variations per parameter-scaling group',
      usageValue: Math.round(usageMetrics.raw.totalVariationsUsed / usageMetrics.raw.totalScalingGroupsUsed),
      usagePercent: usageMetrics.local.variationUsage
    },
    {
      key: 'versions',
      label: 'Max Versions',
      value: capacityConfig.maxValues.versions,
      min: 5,
      max: 50,
      description: 'Maximum configurable versions',
      usageValue: usageMetrics.raw.usedVersions,
      usagePercent: usageMetrics.local.versionUsage
    },
    {
      key: 'years',
      label: 'Plant Lifetime (Years)',
      value: capacityConfig.maxValues.years,
      min: 5,
      max: 50,
      description: 'Maximum plant lifetime in years',
      usageValue: usageMetrics.raw.yearsConfigured,
      usagePercent: usageMetrics.local.temporalUsage
    }
  ];

  return (
    <Card 
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>
            <PieChartOutlined /> System Capacity Map
          </span>
          <div>
            <Button 
              type="text" 
              icon={<SettingOutlined />} 
              onClick={() => setShowAdvanced(!showAdvanced)}
            />
            {onClose && (
              <Button 
                type="text" 
                onClick={onClose}
              >
                Close
              </Button>
            )}
          </div>
        </div>
      }
      style={{ width: '100%' }}
    >
      {/* Global usage display */}
      <div className="global-usage-section">
        <Row gutter={16} align="middle">
          <Col span={8}>
            <Tooltip title="Overall system capacity utilization based on weighted metrics">
              <Progress
                type="dashboard"
                percent={usageMetrics.global}
                status={getStatusColor(usageMetrics.global)}
                format={percent => `${percent}%`}
                width={120}
              />
            </Tooltip>
          </Col>
          <Col span={16}>
            <Title level={4}>System Capacity Utilization</Title>
            <Paragraph>
              Your application is currently utilizing {usageMetrics.global}% of its configured capacity.
              {usageMetrics.global > 80 && (
                <Alert
                  style={{ marginTop: 8 }}
                  message="High utilization detected"
                  description="Consider adjusting capacity limits to optimize performance."
                  type="warning"
                  showIcon
                />
              )}
            </Paragraph>

            <Tooltip title="Total theoretical vs. actual value combinations">
              <div style={{ marginTop: 16 }}>
                <Text strong>Total Capacity Usage: </Text>
                <Text>{usageMetrics.totalCapacity.percentage}% </Text>
                <Text type="secondary">
                  ({formatLargeNumber(usageMetrics.totalCapacity.used)} of {formatLargeNumber(usageMetrics.totalCapacity.theoretical)} possible value combinations)
                </Text>
              </div>
            </Tooltip>
          </Col>
        </Row>
      </div>

      <Divider />

      {/* Category usage display */}
      <div className="category-usage-section">
        <Title level={4}>
          <AreaChartOutlined /> Category Utilization
        </Title>
        <Row gutter={16}>
          <Col span={12}>
            <Card title="Configuration Capacity" size="small">
              <Progress
                percent={usageMetrics.category.configCapacity}
                status={getStatusColor(usageMetrics.category.configCapacity)}
                strokeWidth={10}
              />
              <Tooltip title="Parameters, scaling groups, and sensitivity variations">
                <Text type="secondary">
                  <InfoCircleOutlined /> Configuration structure capacity
                </Text>
              </Tooltip>
            </Card>
          </Col>
          <Col span={12}>
            <Card title="Temporal Capacity" size="small">
              <Progress
                percent={usageMetrics.category.temporalCapacity}
                status={getStatusColor(usageMetrics.category.temporalCapacity)}
                strokeWidth={10}
              />
              <Tooltip title="Versions and plant lifetime utilization">
                <Text type="secondary">
                  <InfoCircleOutlined /> Time-based configuration capacity
                </Text>
              </Tooltip>
            </Card>
          </Col>
        </Row>
      </div>

      <Divider />

      {/* Local usage metrics */}
      <div className="local-usage-section">
        <Title level={4}>
          <LineChartOutlined /> Detailed Capacity Metrics
        </Title>
        <Table
          dataSource={configItems.map(item => ({
            ...item,
            key: item.key,
            status: getStatusColor(item.usagePercent)
          }))}
          pagination={false}
          size="small"
          columns={[
            {
              title: 'Component',
              dataIndex: 'label',
              key: 'label',
              render: (text, record) => (
                <Tooltip title={record.description}>
                  <span>{text} <InfoCircleOutlined /></span>
                </Tooltip>
              )
            },
            {
              title: 'Usage',
              key: 'usage',
              render: (_, record) => (
                <span>
                  {record.usageValue} / {record.value} ({record.usagePercent}%)
                </span>
              )
            },
            {
              title: 'Utilization',
              dataIndex: 'usagePercent',
              key: 'usagePercent',
              render: (percent, record) => (
                <Progress 
                  percent={percent} 
                  status={record.status}
                  size="small"
                  strokeWidth={5}
                />
              )
            }
          ]}
        />
      </div>

      {/* Capacity configuration controls */}
      {showAdvanced && (
        <>
          <Divider>
            <SettingOutlined /> Capacity Configuration
          </Divider>
          <div className="capacity-config-section">
            <Alert
              message="Efficacy Time Constraint"
              description={
                <div>
                  <p>The system enforces one value per parameter per time unit (year) per scaling group. 
                  Each scaling group can be customized for every time unit and enjoys the same sensitivity 
                  variation capabilities as base parameters.</p>
                  <p><strong>Note:</strong> This creates a multiplicative effect on capacity: 
                  Parameters × Scaling Groups × Sensitivity Variations × Years × Versions</p>
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            {configItems.map(item => (
              <div key={item.key} style={{ marginBottom: 16 }}>
                <Row>
                  <Col span={24}>
                    <Tooltip title={item.description}>
                      <Text strong>{item.label}</Text> <InfoCircleOutlined />
                    </Tooltip>
                  </Col>
                </Row>
                <Row gutter={16} align="middle">
                  <Col span={16}>
                    <Slider
                      min={item.min}
                      max={item.max}
                      value={item.value}
                      onChange={value => handleCapacityChange(item.key, value)}
                    />
                  </Col>
                  <Col span={8}>
                    <InputNumber
                      min={item.min}
                      max={item.max}
                      value={item.value}
                      onChange={value => handleCapacityChange(item.key, value)}
                      style={{ width: '100%' }}
                    />
                  </Col>
                </Row>
                <Row>
                  <Col span={24}>
                    <Text type="secondary">
                      Current usage: {item.usageValue} / {item.value} ({item.usagePercent}%)
                    </Text>
                  </Col>
                </Row>
              </div>
            ))}
            
            <div style={{ background: '#f5f5f5', padding: 16, marginBottom: 16, borderRadius: 4 }}>
              <Text strong>Capacity Impact Calculator</Text>
              <div style={{ marginTop: 8 }}>
                <Text>With current settings, the theoretical maximum capacity is:</Text>
                <div style={{ marginTop: 4, marginBottom: 8 }}>
                  <Text code>{capacityConfig.maxValues.parameters} Parameters × 
                    {capacityConfig.maxValues.scalingGroups} Scaling Groups × 
                    {capacityConfig.maxValues.sensitivityVariations} Sensitivity Variations × 
                    {capacityConfig.maxValues.years} Years × 
                    {capacityConfig.maxValues.versions} Versions = 
                    {formatLargeNumber(
                      capacityConfig.maxValues.parameters * 
                      capacityConfig.maxValues.scalingGroups *
                      capacityConfig.maxValues.sensitivityVariations *
                      capacityConfig.maxValues.years *
                      capacityConfig.maxValues.versions
                    )} distinct values</Text>
                </div>
              </div>
            </div>
            
            <Divider>Weight Configuration</Divider>
            <Paragraph>
              Adjust weights to change how different components affect the overall capacity calculation.
            </Paragraph>
            
            {Object.entries(capacityConfig.weights).map(([key, value]) => (
              <div key={key} style={{ marginBottom: 12 }}>
                <Row gutter={16} align="middle">
                  <Col span={8}>
                    <Text>{key.charAt(0).toUpperCase() + key.slice(1)} Weight:</Text>
                  </Col>
                  <Col span={12}>
                    <Slider
                      min={1}
                      max={10}
                      value={value}
                      onChange={value => handleWeightChange(key, value)}
                    />
                  </Col>
                  <Col span={4}>
                    <InputNumber
                      min={1}
                      max={10}
                      value={value}
                      onChange={value => handleWeightChange(key, value)}
                      style={{ width: '100%' }}
                    />
                  </Col>
                </Row>
              </div>
            ))}
            
            <Row justify="end" style={{ marginTop: 16 }}>
              <Button 
                onClick={handleReset}
                style={{ marginRight: 8 }}
              >
                Reset to Defaults
              </Button>
              <Button 
                type="primary"
                onClick={() => setShowAdvanced(false)}
              >
                Apply
              </Button>
            </Row>
          </div>
        </>
      )}

      {/* Key information about capacity constraints */}
      <Divider />
      <Alert
        message="About System Capacity"
        description={
          <div>
            <Paragraph>
              The system capacity map provides insights into how much of the available configuration space is being utilized.
            </Paragraph>
            <Paragraph>
              <strong>Key constraints and capacity factors:</strong>
              <ul>
                <li>Each parameter (S10-S84) can have up to {capacityConfig.maxValues.scalingGroups} scaling groups</li>
                <li>Each parameter-scaling group combination can have up to {capacityConfig.maxValues.sensitivityVariations} sensitivity variations</li>
                <li>Each scaling group enjoys customization down to every time unit (currently year)</li>
                <li>Only one value per parameter per year per scaling group is possible (degree of freedom constraint)</li>
                <li>The system supports up to {capacityConfig.maxValues.versions} configurable versions</li>
              </ul>
            </Paragraph>
            <Paragraph>
              <strong>Exclusions from combinatorial calculations:</strong>
              <ul>
                <li>Number of plots (trivial combinatoric multiplier)</li>
                <li>Interchangeable x and y axes</li>
                <li>Zones (currently only one area is considered)</li>
              </ul>
            </Paragraph>
            <Paragraph>
              <WarningOutlined /> This capacity reporting is intended as an informational tool to help understand system utilization, not as a strict limitation.
            </Paragraph>
          </div>
        }
        type="info"
        showIcon
      />
    </Card>
  );
};

export default CapacityMapPanel;
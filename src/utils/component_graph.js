import * as d3 from 'd3';

/**
 * Generate an interactive component dependency graph visualization
 * Uses the D3.js force-directed graph algorithm
 */
export function renderComponentGraph(container, data, options = {}) {
  const { width = 960, height = 700 } = options;

  // Clear any existing visualization
  d3.select(container).html("");

  // Create SVG container
  const svg = d3.select(container)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("class", "component-graph");

  // Create tooltip
  const tooltip = d3.select(container)
    .append("div")
    .attr("class", "graph-tooltip")
    .style("opacity", 0);

  // Process data into nodes and links
  const { nodes, links } = processGraphData(data);

  // Create force simulation
  const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.id).distance(100))
    .force("charge", d3.forceManyBody().strength(-300))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collision", d3.forceCollide().radius(30));

  // Create link elements
  const link = svg.append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(links)
    .enter()
    .append("line")
    .attr("class", d => `link ${d.type}`)
    .attr("stroke-width", d => Math.sqrt(d.value))
    .attr("stroke", d => getLinkColor(d.type));

  // Create node elements
  const node = svg.append("g")
    .attr("class", "nodes")
    .selectAll(".node")
    .data(nodes)
    .enter()
    .append("g")
    .attr("class", "node")
    .call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended));

  // Add circles to nodes
  node.append("circle")
    .attr("r", d => getNodeRadius(d))
    .attr("fill", d => getNodeColor(d))
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5);

  // Add labels to nodes
  node.append("text")
    .attr("dy", 4)
    .attr("text-anchor", "middle")
    .text(d => d.name)
    .attr("font-family", "var(--font-family, sans-serif)")
    .attr("font-size", "10px")
    .attr("fill", "#fff");

  // Add tooltips
  node.on("mouseover", function(event, d) {
      tooltip.transition()
        .duration(200)
        .style("opacity", .9);
      tooltip.html(createTooltipContent(d))
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function() {
      tooltip.transition()
        .duration(500)
        .style("opacity", 0);
    });

  // Add interactivity on node click
  node.on("click", (event, d) => {
    highlightRelatedNodes(d, node, link);
    showComponentDetails(d);
  });

  // Update positions on each simulation tick
  simulation.on("tick", () => {
    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

    node.attr("transform", d => `translate(${d.x},${d.y})`);
  });

  // Add zoom behavior
  const zoom = d3.zoom()
    .scaleExtent([0.1, 4])
    .on("zoom", zoomed);

  svg.call(zoom);

  function zoomed(event) {
    svg.selectAll("g").attr("transform", event.transform);
  }

  // Drag event handlers
  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  // Legend
  addGraphLegend(svg, width);

  return {
    svg,
    simulation,
    update: (newData) => {
      // Function to update the graph with new data
      const { nodes: newNodes, links: newLinks } = processGraphData(newData);

      // Update the simulation with new data
      simulation.nodes(newNodes);
      simulation.force("link").links(newLinks);

      // Update links
      const linkUpdate = svg.select(".links").selectAll("line")
        .data(newLinks, d => `${d.source.id}-${d.target.id}`);

      // Remove old links
      linkUpdate.exit().remove();

      // Add new links
      const linkEnter = linkUpdate.enter()
        .append("line")
        .attr("class", d => `link ${d.type}`)
        .attr("stroke-width", d => Math.sqrt(d.value))
        .attr("stroke", d => getLinkColor(d.type));

      // Merge links
      const link = linkUpdate.merge(linkEnter);

      // Update nodes
      const nodeUpdate = svg.select(".nodes").selectAll(".node")
        .data(newNodes, d => d.id);

      // Remove old nodes
      nodeUpdate.exit().remove();

      // Add new nodes
      const nodeEnter = nodeUpdate.enter()
        .append("g")
        .attr("class", "node")
        .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));

      // Add circles to new nodes
      nodeEnter.append("circle")
        .attr("r", d => getNodeRadius(d))
        .attr("fill", d => getNodeColor(d))
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5);

      // Add labels to new nodes
      nodeEnter.append("text")
        .attr("dy", 4)
        .attr("text-anchor", "middle")
        .text(d => d.name)
        .attr("font-family", "var(--font-family, sans-serif)")
        .attr("font-size", "10px")
        .attr("fill", "#fff");

      // Add tooltips to new nodes
      nodeEnter.on("mouseover", function(event, d) {
          tooltip.transition()
            .duration(200)
            .style("opacity", .9);
          tooltip.html(createTooltipContent(d))
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
          tooltip.transition()
            .duration(500)
            .style("opacity", 0);
        });

      // Add click behavior to new nodes
      nodeEnter.on("click", (event, d) => {
        highlightRelatedNodes(d, nodeUpdate.merge(nodeEnter), link);
        showComponentDetails(d);
      });

      // Merge nodes
      const node = nodeUpdate.merge(nodeEnter);

      // Update existing nodes
      node.select("circle")
        .attr("r", d => getNodeRadius(d))
        .attr("fill", d => getNodeColor(d));

      node.select("text")
        .text(d => d.name);

      // Restart the simulation
      simulation.alpha(0.3).restart();

      // Update the tick function
      simulation.on("tick", () => {
        link
          .attr("x1", d => d.source.x)
          .attr("y1", d => d.source.y)
          .attr("x2", d => d.target.x)
          .attr("y2", d => d.target.y);

        node.attr("transform", d => `translate(${d.x},${d.y})`);
      });

      return { node, link };
    }
  };
}

/**
 * Process raw data into graph format
 */
function processGraphData(data) {
  // If data is already in the correct format, return it
  if (data.nodes && data.links) {
    return data;
  }

  // Otherwise, convert from component list format
  const nodes = [];
  const links = [];
  const nodeMap = new Map();

  // First pass: create nodes
  data.forEach(component => {
    if (!nodeMap.has(component.id)) {
      const node = {
        id: component.id,
        name: component.name || component.id,
        type: component.type || 'default',
        category: component.category || 'default',
        importance: component.importance || 1,
        metadata: component.metadata || {}
      };
      nodes.push(node);
      nodeMap.set(component.id, node);
    }
  });

  // Second pass: create links
  data.forEach(component => {
    if (component.dependencies) {
      component.dependencies.forEach(dep => {
        if (nodeMap.has(dep.target)) {
          links.push({
            source: component.id,
            target: dep.target,
            type: dep.type || 'default',
            value: dep.value || 1
          });
        }
      });
    }
  });

  return { nodes, links };
}

/**
 * Get node radius based on type and importance
 */
function getNodeRadius(node) {
  // Base radius
  const baseRadius = 10;

  // Adjust based on importance (if available)
  if (node.importance) {
    return baseRadius * Math.sqrt(node.importance);
  }

  // Type-based sizing
  switch (node.type) {
    case 'core':
      return baseRadius * 1.5;
    case 'utility':
      return baseRadius * 0.8;
    case 'container':
      return baseRadius * 1.2;
    default:
      return baseRadius;
  }
}

/**
 * Get node color based on type and category
 */
function getNodeColor(node) {
  // Type-based coloring
  const typeColors = {
    'core': '#ff5722',       // Deep orange
    'ui': '#2196f3',         // Blue
    'container': '#9c27b0',  // Purple
    'utility': '#4caf50',    // Green
    'hoc': '#ff9800',        // Orange
    'hook': '#e91e63',       // Pink
    'context': '#673ab7',    // Deep purple
    'default': '#607d8b'     // Blue grey
  };

  // Category-based coloring (overrides type if specified)
  const categoryColors = {
    'data': '#00bcd4',       // Cyan
    'layout': '#3f51b5',     // Indigo
    'form': '#8bc34a',       // Light green
    'navigation': '#ffc107', // Amber
    'visualization': '#009688', // Teal
    'authentication': '#f44336', // Red
    'default': '#607d8b'     // Blue grey
  };

  // If category is specified and not default, use category color
  if (node.category && node.category !== 'default' && categoryColors[node.category]) {
    return categoryColors[node.category];
  }

  // Otherwise use type color or default
  return typeColors[node.type] || typeColors.default;
}

/**
 * Get link color based on relationship type
 */
function getLinkColor(type) {
  const linkColors = {
    'import': '#666666',     // Dark grey
    'parent-child': '#999999', // Medium grey
    'context': '#bbbbbb',    // Light grey
    'data-flow': '#333333',  // Very dark grey
    'event': '#777777',      // Grey
    'default': '#aaaaaa'     // Default grey
  };

  return linkColors[type] || linkColors.default;
}

/**
 * Create tooltip content for node
 */
function createTooltipContent(node) {
  let content = `<div class="tooltip-title">${node.name}</div>`;

  // Add type and category if available
  if (node.type && node.type !== 'default') {
    content += `<div class="tooltip-type">Type: ${node.type}</div>`;
  }

  if (node.category && node.category !== 'default') {
    content += `<div class="tooltip-category">Category: ${node.category}</div>`;
  }

  // Add importance if available
  if (node.importance && node.importance !== 1) {
    content += `<div class="tooltip-importance">Importance: ${node.importance}</div>`;
  }

  // Add metadata if available
  if (node.metadata && Object.keys(node.metadata).length > 0) {
    content += '<div class="tooltip-metadata">';
    for (const [key, value] of Object.entries(node.metadata)) {
      if (key !== 'description') { // Handle description separately
        content += `<div><span>${key}:</span> ${value}</div>`;
      }
    }
    content += '</div>';

    // Add description at the bottom if available
    if (node.metadata.description) {
      content += `<div class="tooltip-description">${node.metadata.description}</div>`;
    }
  }

  return content;
}

/**
 * Highlight nodes related to selected node
 */
function highlightRelatedNodes(selectedNode, allNodes, allLinks) {
  // Reset all nodes and links to default opacity
  allNodes.selectAll('circle')
    .attr('opacity', 0.3)
    .attr('stroke-width', 1.5);

  allNodes.selectAll('text')
    .attr('opacity', 0.3);

  allLinks
    .attr('opacity', 0.1)
    .attr('stroke-width', d => Math.sqrt(d.value));

  // Set of related node IDs (including the selected node)
  const relatedNodeIds = new Set([selectedNode.id]);

  // Find all directly connected nodes
  allLinks.each(function(d) {
    if (d.source.id === selectedNode.id) {
      relatedNodeIds.add(d.target.id);
    } else if (d.target.id === selectedNode.id) {
      relatedNodeIds.add(d.source.id);
    }
  });

  // Highlight the related nodes
  allNodes.filter(d => relatedNodeIds.has(d.id))
    .selectAll('circle')
    .attr('opacity', 1)
    .attr('stroke-width', 2.5);

  allNodes.filter(d => relatedNodeIds.has(d.id))
    .selectAll('text')
    .attr('opacity', 1);

  // Highlight the related links
  allLinks.filter(d => 
    relatedNodeIds.has(d.source.id) && relatedNodeIds.has(d.target.id)
  )
    .attr('opacity', 1)
    .attr('stroke-width', d => Math.sqrt(d.value) * 1.5);
}

/**
 * Show detailed component information panel
 */
function showComponentDetails(node) {
  // Find or create the details panel
  let detailsPanel = document.getElementById('component-details-panel');

  if (!detailsPanel) {
    detailsPanel = document.createElement('div');
    detailsPanel.id = 'component-details-panel';
    detailsPanel.className = 'component-details-panel';

    // Add close button
    const closeButton = document.createElement('button');
    closeButton.className = 'close-button';
    closeButton.innerHTML = '&times;';
    closeButton.onclick = () => {
      detailsPanel.classList.remove('visible');
    };

    detailsPanel.appendChild(closeButton);

    // Add content container
    const content = document.createElement('div');
    content.className = 'details-content';
    detailsPanel.appendChild(content);

    document.body.appendChild(detailsPanel);
  }

  // Update panel content
  const content = detailsPanel.querySelector('.details-content');

  // Basic information
  let html = `
    <h2>${node.name}</h2>
    <div class="details-section">
      <div class="details-row">
        <span class="details-label">Type:</span>
        <span class="details-value">${node.type || 'Not specified'}</span>
      </div>
      <div class="details-row">
        <span class="details-label">Category:</span>
        <span class="details-value">${node.category || 'Not specified'}</span>
      </div>
      <div class="details-row">
        <span class="details-label">Importance:</span>
        <span class="details-value">${node.importance || 1}</span>
      </div>
    </div>
  `;

  // Metadata section
  if (node.metadata && Object.keys(node.metadata).length > 0) {
    html += '<div class="details-section"><h3>Metadata</h3>';

    // Description first if available
    if (node.metadata.description) {
      html += `
        <div class="details-description">
          ${node.metadata.description}
        </div>
      `;
    }

    // Other metadata
    for (const [key, value] of Object.entries(node.metadata)) {
      if (key !== 'description') {
        html += `
          <div class="details-row">
            <span class="details-label">${key}:</span>
            <span class="details-value">${value}</span>
          </div>
        `;
      }
    }

    html += '</div>';
  }

  // Add file path with link if available
  if (node.metadata && node.metadata.filePath) {
    html += `
      <div class="details-section">
        <h3>File</h3>
        <a href="#" class="file-link" data-path="${node.metadata.filePath}">
          ${node.metadata.filePath}
        </a>
      </div>
    `;
  }

  content.innerHTML = html;

  // Add event listener for file link if needed
  const fileLink = content.querySelector('.file-link');
  if (fileLink) {
    fileLink.addEventListener('click', (e) => {
      e.preventDefault();
      const path = e.target.getAttribute('data-path');
      // Trigger file opening event or navigation
      if (window.openFile && typeof window.openFile === 'function') {
        window.openFile(path);
      }
    });
  }

  // Show the panel
  detailsPanel.classList.add('visible');
}

/**
 * Add legend to graph
 */
function addGraphLegend(svg, width) {
  const legendData = [
    { label: 'Core Component', color: '#ff5722', type: 'node' },
    { label: 'UI Component', color: '#2196f3', type: 'node' },
    { label: 'Container', color: '#9c27b0', type: 'node' },
    { label: 'Utility', color: '#4caf50', type: 'node' },
    { label: 'HOC', color: '#ff9800', type: 'node' },
    { label: 'Hook', color: '#e91e63', type: 'node' },
    { label: 'Context Provider', color: '#673ab7', type: 'node' },
    { label: 'Import Dependency', color: '#666666', type: 'link' },
    { label: 'Parent-Child', color: '#999999', type: 'link' },
    { label: 'Context Dependency', color: '#bbbbbb', type: 'link' },
    { label: 'Data Flow', color: '#333333', type: 'link' }
  ];

  // Create legend container
  const legend = svg.append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(${width - 200}, 20)`);

  // Add legend title
  legend.append('text')
    .attr('class', 'legend-title')
    .attr('x', 0)
    .attr('y', 0)
    .text('Legend')
    .attr('font-weight', 'bold')
    .attr('font-family', 'var(--font-family, sans-serif)')
    .attr('font-size', '12px');

  // Add legend items
  const legendItems = legend.selectAll('.legend-item')
    .data(legendData)
    .enter()
    .append('g')
    .attr('class', 'legend-item')
    .attr('transform', (d, i) => `translate(0, ${i * 20 + 20})`);

  // Add appropriate symbol based on type
  legendItems.each(function(d) {
    const item = d3.select(this);

    if (d.type === 'node') {
      // Add circle for nodes
      item.append('circle')
        .attr('r', 6)
        .attr('cx', 6)
        .attr('cy', 0)
        .attr('fill', d.color);
    } else {
      // Add line for links
      item.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', 12)
        .attr('y2', 0)
        .attr('stroke', d.color)
        .attr('stroke-width', 2);
    }

    // Add label
    item.append('text')
      .attr('x', 20)
      .attr('y', 4)
      .text(d.label)
      .attr('font-family', 'var(--font-family, sans-serif)')
      .attr('font-size', '10px');
  });

  // Add background rectangle
  const bbox = legend.node().getBBox();
  legend.insert('rect', ':first-child')
    .attr('x', bbox.x - 10)
    .attr('y', bbox.y - 10)
    .attr('width', bbox.width + 20)
    .attr('height', bbox.height + 20)
    .attr('fill', 'white')
    .attr('opacity', 0.8)
    .attr('rx', 5)
    .attr('ry', 5);
}

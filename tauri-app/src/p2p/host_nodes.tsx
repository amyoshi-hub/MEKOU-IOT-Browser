// components/GraphVisualization.tsx
import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

type GraphVisualizationProps = {
  nodeCount: number;
  onNodeClick?: (nodeId: number) => void;
};

const GraphVisualization: React.FC<GraphVisualizationProps> = ({ nodeCount, onNodeClick }: GraphVisualizationProps) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // 再描画時にクリーンアップ

    
    const svgElement = svgRef.current;
    const width = svgElement?.clientWidth || 400;
    const height = svgElement?.clientHeight || 400;

    interface NodeDatum extends d3.SimulationNodeDatum {
  	id: number;
    }
    const nodes: NodeDatum[] = d3.range(nodeCount).map((i) => ({ id: i }));
    const links = [];
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        links.push({ source: i, target: j });
      }
    }

    const simulation = d3
      .forceSimulation(nodes)
      .force("link", d3.forceLink(links).distance(150).strength(1).id((d: any) => d.id))
      .force("charge", d3.forceManyBody().strength(-500))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg
      .append("g")
      .attr("stroke", "#999")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line");

    const node = svg
      .append("g")
      .selectAll("circle")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("r", 15)
      .style("cursor", "pointer")
      .on("click", (_, d) => {
     	if(onNodeClick)onNodeClick(d.id); 
      })
      .call(createDrag(simulation));

    const label = svg
      .append("g")
      .selectAll("text")
      .data(nodes)
      .enter()
      .append("text")
      .text((d) => d.id)
      .attr("dy", 4)
      .attr("dx", -15);

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y);
      label.attr("x", (d: any) => d.x).attr("y", (d: any) => d.y);
    });

    let time = 0;
    let animationFrameId: number;

    function animateColors() {
      time += 0.05;
      node.attr("fill", (d: any) => {
        if (d.id === 5) {
          const flicker = Math.abs(Math.sin(time * 5));
          return `rgb(255, ${Math.floor(50 * flicker)}, ${Math.floor(50 * flicker)})`;
        }

        const r = Math.floor(128 + 127 * Math.sin(time + d.id));
        const g = Math.floor(128 + 127 * Math.sin(time + d.id + 2));
        const b = Math.floor(128 + 127 * Math.sin(time + d.id + 4));
        return `rgb(${r},${g},${b})`;
      });

      animationFrameId = requestAnimationFrame(animateColors);
    }

    animateColors();

    
  function createDrag(simulation: d3.Simulation<NodeDatum, undefined>) {
  function dragstarted(event: any, d: NodeDatum) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }
  function dragged(event: any, d: NodeDatum) {
    d.fx = event.x;
    d.fy = event.y;
  }
  function dragended(event: any, d: NodeDatum) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }
  return d3.drag<SVGCircleElement, NodeDatum>()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended);
}


    return () => {
      cancelAnimationFrame(animationFrameId);
      simulation.stop();
      svg.selectAll("*").remove();
    };
  }, [nodeCount]);

  return <svg ref={svgRef} width="100%" height="100%" />;
};

export default GraphVisualization;


import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { SpectrumPoint, RadioConfig } from '../types';

interface SpectrumDisplayProps {
  data: SpectrumPoint[];
  config: RadioConfig;
  height?: number;
}

export const SpectrumDisplay: React.FC<SpectrumDisplayProps> = ({ data, config, height = 300 }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Responsive dimensions
  const width = 800; // ViewBox width, scales via CSS
  const margin = { top: 20, right: 30, bottom: 30, left: 50 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Scales
  const xScale = useMemo(() => {
    const minFreq = config.centerFreq - (config.bandwidth / 2);
    const maxFreq = config.centerFreq + (config.bandwidth / 2);
    return d3.scaleLinear().domain([minFreq, maxFreq]).range([0, innerWidth]);
  }, [config, innerWidth]);

  const yScale = useMemo(() => {
    return d3.scaleLinear().domain([-100, 0]).range([innerHeight, 0]);
  }, [innerHeight]);

  // Line Generator
  const lineGenerator = d3.line<SpectrumPoint>()
    .curve(d3.curveMonotoneX)
    .x(d => xScale(d.frequency))
    .y(d => yScale(d.db));

  // Area Generator for gradient fill
  const areaGenerator = d3.area<SpectrumPoint>()
    .curve(d3.curveMonotoneX)
    .x(d => xScale(d.frequency))
    .y0(innerHeight)
    .y1(d => yScale(d.db));

  // Render Axes using D3 side-effects
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    
    // X Axis
    const xAxis = d3.axisBottom(xScale)
      .ticks(5)
      .tickFormat(d => `${d}M`);
      
    svg.select<SVGGElement>('.x-axis')
      .transition().duration(200) // Smooth transition when freq changes
      .call(xAxis);

    // Y Axis
    const yAxis = d3.axisLeft(yScale)
      .ticks(5)
      .tickFormat(d => `${d} dB`);

    svg.select<SVGGElement>('.y-axis')
      .call(yAxis);

  }, [xScale, yScale]);

  return (
    <div ref={containerRef} className="w-full relative bg-black rounded-lg border border-slate-700 overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)]">
       {/* Background Grid - Simulated with CSS/SVG pattern could be better, but simple rect here */}
       <div className="absolute inset-0 opacity-20 pointer-events-none" 
            style={{
              backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}>
       </div>

      <svg 
        ref={svgRef} 
        viewBox={`0 0 ${width} ${height}`} 
        className="w-full h-full relative z-10"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="spectrumGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.6" />
            <stop offset="90%" stopColor="#06b6d4" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
             <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
             <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
             </feMerge>
          </filter>
        </defs>

        <g transform={`translate(${margin.left},${margin.top})`}>
          {/* Axes Groups */}
          <g className="x-axis text-slate-400 font-mono text-xs" transform={`translate(0,${innerHeight})`} />
          <g className="y-axis text-slate-400 font-mono text-xs" />

          {/* Area Fill */}
          <path
            d={areaGenerator(data) || ''}
            fill="url(#spectrumGradient)"
            className="transition-all duration-75 ease-linear"
          />

          {/* Line Stroke */}
          <path
            d={lineGenerator(data) || ''}
            fill="none"
            stroke="#22d3ee"
            strokeWidth="2"
            filter="url(#glow)"
            className="transition-all duration-75 ease-linear"
          />

          {/* Peak Indicators (Simulated logic for visualization) */}
          {data.length > 0 && data.reduce((max, p) => p.db > max.db ? p : max, data[0]).db > -70 && (
             <g transform={`translate(${xScale(data.reduce((max, p) => p.db > max.db ? p : max, data[0]).frequency)}, ${yScale(data.reduce((max, p) => p.db > max.db ? p : max, data[0]).db) - 10})`}>
                <text textAnchor="middle" fill="#fff" fontSize="10" className="font-mono">PEAK</text>
                <polygon points="0,5 -3,0 3,0" fill="#fff" />
             </g>
          )}
        </g>
      </svg>
      
      {/* HUD Overlay */}
      <div className="absolute top-2 right-4 text-xs font-mono text-cyan-400 opacity-80">
        SPAN: {config.bandwidth} MHz <br/>
        RBW: {(config.bandwidth / data.length * 1000).toFixed(0)} kHz
      </div>
    </div>
  );
};
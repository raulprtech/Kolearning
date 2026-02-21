"use client"

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Network, ZoomIn, ZoomOut, RotateCcw, Lightbulb, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

// Types matching the AI flow output
interface ConceptRelationship {
    fromConcept: string;
    toConcept: string;
    relationshipType: string;
    strength: string;
    description: string;
    pedagogicalImportance: string;
}

interface ConceptCluster {
    clusterId: string;
    name: string;
    description: string;
    concepts: string[];
    centralConcept: string;
    difficulty: string;
    estimatedStudyTime: number;
}

interface ConceptMapData {
    conceptMap: {
        totalConcepts: number;
        relationships: ConceptRelationship[];
        clusters: ConceptCluster[];
        learningPaths: any[];
    };
    studyRecommendations: {
        recommendedStartingPoints: string[];
        difficultyProgression: { level: string; concepts: string[] }[];
    };
    insights: {
        keyFoundationalConcepts: string[];
        mostConnectedConcepts: string[];
        potentialLearningBottlenecks: string[];
        conceptGaps: string[];
    };
}

interface ConceptMapProps {
    data: ConceptMapData;
}

// Node position calculation using force-directed layout simulation
function calculateLayout(data: ConceptMapData) {
    const concepts = new Set<string>();
    data.conceptMap.relationships.forEach(r => {
        concepts.add(r.fromConcept);
        concepts.add(r.toConcept);
    });
    data.conceptMap.clusters.forEach(c => c.concepts.forEach(concept => concepts.add(concept)));

    const conceptList = Array.from(concepts);
    const width = 900;
    const height = 600;
    const centerX = width / 2;
    const centerY = height / 2;

    // Assign positions by cluster with circular layout
    const positions: Record<string, { x: number; y: number }> = {};
    const clusters = data.conceptMap.clusters;

    if (clusters.length > 0) {
        const clusterAngleStep = (2 * Math.PI) / Math.max(clusters.length, 1);
        const clusterRadius = Math.min(width, height) * 0.3;

        clusters.forEach((cluster, ci) => {
            const clusterCenterX = centerX + Math.cos(ci * clusterAngleStep - Math.PI / 2) * clusterRadius;
            const clusterCenterY = centerY + Math.sin(ci * clusterAngleStep - Math.PI / 2) * clusterRadius;

            const conceptAngleStep = (2 * Math.PI) / Math.max(cluster.concepts.length, 1);
            const itemRadius = Math.min(80, 40 + cluster.concepts.length * 8);

            cluster.concepts.forEach((concept, i) => {
                positions[concept] = {
                    x: clusterCenterX + Math.cos(i * conceptAngleStep) * itemRadius,
                    y: clusterCenterY + Math.sin(i * conceptAngleStep) * itemRadius,
                };
            });
        });
    }

    // Position any remaining concepts not in clusters
    let unpositioned = conceptList.filter(c => !positions[c]);
    unpositioned.forEach((concept, i) => {
        const angle = (i / unpositioned.length) * 2 * Math.PI;
        positions[concept] = {
            x: centerX + Math.cos(angle) * (Math.min(width, height) * 0.4),
            y: centerY + Math.sin(angle) * (Math.min(width, height) * 0.4),
        };
    });

    return { positions, width, height };
}

const difficultyColors: Record<string, string> = {
    foundational: "#22c55e",
    intermediate: "#eab308",
    advanced: "#ef4444",
};

const relationTypeColors: Record<string, string> = {
    prerequisite: "#ef4444",
    supports: "#3b82f6",
    similar: "#8b5cf6",
    contrasts: "#f97316",
    applies_to: "#06b6d4",
    part_of: "#10b981",
    example_of: "#a855f7",
    derives_from: "#f59e0b",
};

const strengthOpacity: Record<string, number> = {
    weak: 0.3,
    moderate: 0.6,
    strong: 1,
};

export default function ConceptMap({ data }: ConceptMapProps) {
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);
    const [hoveredEdge, setHoveredEdge] = useState<number | null>(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const svgRef = useRef<SVGSVGElement>(null);

    const { positions, width, height } = useMemo(() => calculateLayout(data), [data]);

    const conceptDifficulty = useMemo(() => {
        const map: Record<string, string> = {};
        data.conceptMap.clusters.forEach(cluster => {
            cluster.concepts.forEach(c => {
                map[c] = cluster.difficulty;
            });
        });
        return map;
    }, [data]);

    const connectedConcepts = useMemo(() => {
        if (!hoveredNode) return new Set<string>();
        const connected = new Set<string>();
        connected.add(hoveredNode);
        data.conceptMap.relationships.forEach(r => {
            if (r.fromConcept === hoveredNode) connected.add(r.toConcept);
            if (r.toConcept === hoveredNode) connected.add(r.fromConcept);
        });
        return connected;
    }, [hoveredNode, data]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button === 0) {
            setIsPanning(true);
            setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        }
    }, [pan]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (isPanning) {
            setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
        }
    }, [isPanning, panStart]);

    const handleMouseUp = useCallback(() => setIsPanning(false), []);

    const truncateLabel = (text: string, maxLen: number = 18) =>
        text.length > maxLen ? text.slice(0, maxLen) + "…" : text;

    return (
        <div className="space-y-4">
            {/* Controls */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => setZoom(z => Math.min(z + 0.2, 3))}>
                        <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setZoom(z => Math.max(z - 0.2, 0.4))}>
                        <ZoomOut className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>
                        <RotateCcw className="h-4 w-4" />
                    </Button>
                    <span className="text-xs text-muted-foreground ml-2">Arrastra para mover • Scroll para zoom</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                    {Object.entries(difficultyColors).map(([key, color]) => (
                        <div key={key} className="flex items-center gap-1 text-xs">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                            <span className="capitalize">{key === 'foundational' ? 'Fundacional' : key === 'intermediate' ? 'Intermedio' : 'Avanzado'}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* SVG Graph */}
            <div className="border rounded-lg bg-background/50 overflow-hidden" style={{ height: "500px" }}>
                <svg
                    ref={svgRef}
                    width="100%"
                    height="100%"
                    viewBox={`0 0 ${width} ${height}`}
                    className="cursor-grab active:cursor-grabbing"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onWheel={(e) => setZoom(z => Math.max(0.4, Math.min(3, z + (e.deltaY > 0 ? -0.1 : 0.1))))}
                >
                    <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                        {/* Cluster background areas */}
                        {data.conceptMap.clusters.map((cluster, ci) => {
                            const clusterPositions = cluster.concepts
                                .filter(c => positions[c])
                                .map(c => positions[c]);
                            if (clusterPositions.length < 2) return null;

                            const cx = clusterPositions.reduce((s, p) => s + p.x, 0) / clusterPositions.length;
                            const cy = clusterPositions.reduce((s, p) => s + p.y, 0) / clusterPositions.length;
                            const maxDist = Math.max(
                                ...clusterPositions.map(p => Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2))
                            );

                            return (
                                <circle
                                    key={`cluster-${ci}`}
                                    cx={cx}
                                    cy={cy}
                                    r={maxDist + 50}
                                    fill={difficultyColors[cluster.difficulty] || "#6b7280"}
                                    fillOpacity={0.06}
                                    stroke={difficultyColors[cluster.difficulty] || "#6b7280"}
                                    strokeOpacity={0.15}
                                    strokeWidth={1.5}
                                    strokeDasharray="6 4"
                                />
                            );
                        })}

                        {/* Edges */}
                        {data.conceptMap.relationships.map((rel, ri) => {
                            const from = positions[rel.fromConcept];
                            const to = positions[rel.toConcept];
                            if (!from || !to) return null;

                            const isHighlighted = hoveredNode
                                ? connectedConcepts.has(rel.fromConcept) && connectedConcepts.has(rel.toConcept)
                                : hoveredEdge === ri;
                            const opacity = hoveredNode && !isHighlighted ? 0.08 : (strengthOpacity[rel.strength] || 0.5);

                            return (
                                <g key={`edge-${ri}`}>
                                    <line
                                        x1={from.x}
                                        y1={from.y}
                                        x2={to.x}
                                        y2={to.y}
                                        stroke={relationTypeColors[rel.relationshipType] || "#6b7280"}
                                        strokeWidth={isHighlighted ? 3 : 1.5}
                                        strokeOpacity={opacity}
                                        strokeDasharray={rel.relationshipType === "prerequisite" ? "" : "4 2"}
                                        onMouseEnter={() => setHoveredEdge(ri)}
                                        onMouseLeave={() => setHoveredEdge(null)}
                                        className="cursor-pointer"
                                    />
                                    {/* Arrow for prerequisite */}
                                    {rel.relationshipType === "prerequisite" && (
                                        <polygon
                                            points={(() => {
                                                const dx = to.x - from.x;
                                                const dy = to.y - from.y;
                                                const len = Math.sqrt(dx * dx + dy * dy);
                                                if (len === 0) return "";
                                                const ux = dx / len;
                                                const uy = dy / len;
                                                const tipX = to.x - ux * 28;
                                                const tipY = to.y - uy * 28;
                                                const px = -uy;
                                                const py = ux;
                                                return `${tipX},${tipY} ${tipX - ux * 8 + px * 5},${tipY - uy * 8 + py * 5} ${tipX - ux * 8 - px * 5},${tipY - uy * 8 - py * 5}`;
                                            })()}
                                            fill={relationTypeColors.prerequisite}
                                            fillOpacity={opacity}
                                        />
                                    )}
                                    {/* Tooltip on hover */}
                                    {hoveredEdge === ri && (
                                        <g>
                                            <rect
                                                x={(from.x + to.x) / 2 - 100}
                                                y={(from.y + to.y) / 2 - 30}
                                                width={200}
                                                height={40}
                                                rx={6}
                                                fill="#1e1e2e"
                                                fillOpacity={0.95}
                                                stroke="#444"
                                                strokeWidth={1}
                                            />
                                            <text
                                                x={(from.x + to.x) / 2}
                                                y={(from.y + to.y) / 2 - 12}
                                                textAnchor="middle"
                                                fill="#fff"
                                                fontSize={10}
                                                fontWeight={600}
                                            >
                                                {rel.relationshipType.replace("_", " ")} ({rel.strength})
                                            </text>
                                            <text
                                                x={(from.x + to.x) / 2}
                                                y={(from.y + to.y) / 2 + 4}
                                                textAnchor="middle"
                                                fill="#aaa"
                                                fontSize={9}
                                            >
                                                {truncateLabel(rel.description, 40)}
                                            </text>
                                        </g>
                                    )}
                                </g>
                            );
                        })}

                        {/* Nodes */}
                        {Object.entries(positions).map(([concept, pos]) => {
                            const difficulty = conceptDifficulty[concept] || "foundational";
                            const color = difficultyColors[difficulty] || "#6b7280";
                            const isFoundational = data.insights.keyFoundationalConcepts.includes(concept);
                            const isHub = data.insights.mostConnectedConcepts.includes(concept);
                            const isHovered = hoveredNode === concept;
                            const dimmed = hoveredNode && !connectedConcepts.has(concept);
                            const nodeRadius = isFoundational || isHub ? 28 : 22;

                            return (
                                <g
                                    key={concept}
                                    onMouseEnter={() => setHoveredNode(concept)}
                                    onMouseLeave={() => setHoveredNode(null)}
                                    className="cursor-pointer"
                                    opacity={dimmed ? 0.15 : 1}
                                >
                                    {/* Glow for hovered */}
                                    {isHovered && (
                                        <circle cx={pos.x} cy={pos.y} r={nodeRadius + 8} fill={color} fillOpacity={0.15} />
                                    )}
                                    {/* Ring for hubs */}
                                    {isHub && (
                                        <circle cx={pos.x} cy={pos.y} r={nodeRadius + 4} fill="none" stroke={color} strokeWidth={2} strokeOpacity={0.4} strokeDasharray="3 2" />
                                    )}
                                    {/* Node circle */}
                                    <circle
                                        cx={pos.x}
                                        cy={pos.y}
                                        r={nodeRadius}
                                        fill={color}
                                        fillOpacity={isHovered ? 0.9 : 0.7}
                                        stroke={isHovered ? "#fff" : color}
                                        strokeWidth={isHovered ? 2.5 : 1.5}
                                        strokeOpacity={isHovered ? 1 : 0.5}
                                    />
                                    {/* Icon for foundational */}
                                    {isFoundational && (
                                        <text x={pos.x} y={pos.y - nodeRadius - 6} textAnchor="middle" fontSize={12}>⭐</text>
                                    )}
                                    {/* Label */}
                                    <text
                                        x={pos.x}
                                        y={pos.y + nodeRadius + 14}
                                        textAnchor="middle"
                                        fill="currentColor"
                                        fontSize={10}
                                        fontWeight={isHovered ? 700 : 500}
                                        className="select-none"
                                    >
                                        {truncateLabel(concept)}
                                    </text>
                                </g>
                            );
                        })}
                    </g>
                </svg>
            </div>

            {/* Insights panel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Starting points */}
                <Card className="bg-card/50">
                    <CardHeader className="py-3 px-4">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Lightbulb className="h-4 w-4 text-green-400" />
                            Puntos de partida
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 px-4 pb-3">
                        <div className="flex flex-wrap gap-1.5">
                            {data.studyRecommendations.recommendedStartingPoints.map(c => (
                                <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Most connected */}
                <Card className="bg-card/50">
                    <CardHeader className="py-3 px-4">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Network className="h-4 w-4 text-blue-400" />
                            Conceptos clave
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 px-4 pb-3">
                        <div className="flex flex-wrap gap-1.5">
                            {data.insights.mostConnectedConcepts.map(c => (
                                <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Bottlenecks */}
                <Card className="bg-card/50">
                    <CardHeader className="py-3 px-4">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-400" />
                            Cuellos de botella
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 px-4 pb-3">
                        <div className="flex flex-wrap gap-1.5">
                            {data.insights.potentialLearningBottlenecks.length > 0 ? (
                                data.insights.potentialLearningBottlenecks.map(c => (
                                    <Badge key={c} variant="destructive" className="text-xs">{c}</Badge>
                                ))
                            ) : (
                                <span className="text-xs text-muted-foreground">Sin cuellos de botella detectados</span>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

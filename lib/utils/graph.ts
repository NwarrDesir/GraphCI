/**
 * Structure de données GRAPHE mathématique
 * Implémentation professionnelle pour opérations complexes
 */

import type { User, Friendship } from '@/lib/types';

/**
 * Nœud du graphe
 */
export interface GraphNode {
  id: string;
  user: User;
  degree: number; // Degré du nœud (nombre de connexions)
  neighbors: Set<string>; // IDs des voisins
}

/**
 * Arête du graphe
 */
export interface GraphEdge {
  id: string;
  source: string; // ID du nœud source
  target: string; // ID du nœud cible
  weight: number; // Poids (peut être distance, affinité, etc.)
  type: 'friendship' | 'proximity' | 'affinity'; // Type de lien
  data?: any; // Données supplémentaires
}

/**
 * Classe Graph - Structure mathématique complète
 */
export class Graph {
  private nodes: Map<string, GraphNode>;
  private edges: Map<string, GraphEdge>;
  private adjacencyList: Map<string, Set<string>>;

  constructor() {
    this.nodes = new Map();
    this.edges = new Map();
    this.adjacencyList = new Map();
  }

  /**
   * Ajouter un nœud
   */
  addNode(user: User): void {
    if (!this.nodes.has(user.id)) {
      this.nodes.set(user.id, {
        id: user.id,
        user,
        degree: 0,
        neighbors: new Set(),
      });
      this.adjacencyList.set(user.id, new Set());
    }
  }

  /**
   * Ajouter une arête
   */
  addEdge(
    sourceId: string,
    targetId: string,
    weight: number = 1,
    type: GraphEdge['type'] = 'friendship',
    data?: any
  ): void {
    const edgeId = `${sourceId}-${targetId}`;
    const reverseEdgeId = `${targetId}-${sourceId}`;

    // Éviter doublons
    if (this.edges.has(edgeId) || this.edges.has(reverseEdgeId)) {
      return;
    }

    // Créer l'arête
    this.edges.set(edgeId, {
      id: edgeId,
      source: sourceId,
      target: targetId,
      weight,
      type,
      data,
    });

    // Mettre à jour la liste d'adjacence
    this.adjacencyList.get(sourceId)?.add(targetId);
    this.adjacencyList.get(targetId)?.add(sourceId);

    // Mettre à jour les voisins et degrés
    const sourceNode = this.nodes.get(sourceId);
    const targetNode = this.nodes.get(targetId);

    if (sourceNode && targetNode) {
      sourceNode.neighbors.add(targetId);
      targetNode.neighbors.add(sourceId);
      sourceNode.degree++;
      targetNode.degree++;
    }
  }

  /**
   * Obtenir tous les nœuds
   */
  getNodes(): GraphNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Obtenir toutes les arêtes
   */
  getEdges(): GraphEdge[] {
    return Array.from(this.edges.values());
  }

  /**
   * Obtenir les voisins d'un nœud
   */
  getNeighbors(nodeId: string): GraphNode[] {
    const neighbors = this.adjacencyList.get(nodeId);
    if (!neighbors) return [];

    return Array.from(neighbors)
      .map(id => this.nodes.get(id))
      .filter((node): node is GraphNode => node !== undefined);
  }

  /**
   * Vérifier si deux nœuds sont connectés
   */
  areConnected(nodeId1: string, nodeId2: string): boolean {
    return this.adjacencyList.get(nodeId1)?.has(nodeId2) || false;
  }

  /**
   * Obtenir le degré d'un nœud
   */
  getDegree(nodeId: string): number {
    return this.nodes.get(nodeId)?.degree || 0;
  }

  /**
   * Obtenir le nombre de nœuds
   */
  get nodeCount(): number {
    return this.nodes.size;
  }

  /**
   * Obtenir le nombre d'arêtes
   */
  get edgeCount(): number {
    return this.edges.size;
  }

  /**
   * Calculer la densité du graphe
   * densité = 2 * |E| / (|V| * (|V| - 1))
   */
  getDensity(): number {
    const n = this.nodeCount;
    if (n <= 1) return 0;
    return (2 * this.edgeCount) / (n * (n - 1));
  }

  /**
   * Trouver le plus court chemin (BFS)
   */
  shortestPath(startId: string, endId: string): string[] | null {
    if (!this.nodes.has(startId) || !this.nodes.has(endId)) {
      return null;
    }

    const queue: string[] = [startId];
    const visited = new Set<string>([startId]);
    const parent = new Map<string, string>();

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (current === endId) {
        // Reconstruire le chemin
        const path: string[] = [];
        let node = endId;
        while (node !== startId) {
          path.unshift(node);
          node = parent.get(node)!;
        }
        path.unshift(startId);
        return path;
      }

      const neighbors = this.adjacencyList.get(current) || new Set();
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          parent.set(neighbor, current);
          queue.push(neighbor);
        }
      }
    }

    return null; // Pas de chemin trouvé
  }

  /**
   * Trouver les composantes connexes
   */
  getConnectedComponents(): string[][] {
    const visited = new Set<string>();
    const components: string[][] = [];

    for (const nodeId of this.nodes.keys()) {
      if (!visited.has(nodeId)) {
        const component: string[] = [];
        const queue = [nodeId];
        visited.add(nodeId);

        while (queue.length > 0) {
          const current = queue.shift()!;
          component.push(current);

          const neighbors = this.adjacencyList.get(current) || new Set();
          for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
              visited.add(neighbor);
              queue.push(neighbor);
            }
          }
        }

        components.push(component);
      }
    }

    return components;
  }

  /**
   * Calculer le clustering coefficient (coefficient de clustering)
   */
  getClusteringCoefficient(nodeId: string): number {
    const neighbors = Array.from(this.adjacencyList.get(nodeId) || []);
    const k = neighbors.length;

    if (k < 2) return 0;

    let edges = 0;
    for (let i = 0; i < neighbors.length; i++) {
      for (let j = i + 1; j < neighbors.length; j++) {
        if (this.areConnected(neighbors[i], neighbors[j])) {
          edges++;
        }
      }
    }

    return (2 * edges) / (k * (k - 1));
  }

  /**
   * Effacer le graphe
   */
  clear(): void {
    this.nodes.clear();
    this.edges.clear();
    this.adjacencyList.clear();
  }
}

/**
 * Construire un graphe depuis les utilisateurs et amitiés
 */
export function buildGraph(users: User[], friendships: Friendship[]): Graph {
  const graph = new Graph();

  // Ajouter tous les nœuds
  users.forEach(user => graph.addNode(user));

  // Ajouter toutes les arêtes (amitiés)
  friendships
    .filter(f => f.status === 'accepted')
    .forEach(friendship => {
      // Les friendships dans Firestore utilisent user1/user2 au lieu de userId1/userId2
      const userId1 = (friendship as any).userId1 || (friendship as any).user1;
      const userId2 = (friendship as any).userId2 || (friendship as any).user2;
      
      if (userId1 && userId2) {
        graph.addEdge(
          userId1,
          userId2,
          1,
          'friendship',
          friendship
        );
      }
    });

  return graph;
}

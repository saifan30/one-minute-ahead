import { Vector2D, Rect, Wall } from '../types/game';

export interface CollisionResult {
  collided: boolean;
  normal: Vector2D;
  penetration: number;
}

/**
 * Tests collision between a circular entity and an axis-aligned bounding box (Wall/Obstacle).
 */
export function checkCircleRectCollision(
  cx: number,
  cy: number,
  radius: number,
  rect: Rect
): CollisionResult {
  // Find closest point on rect to circle center
  const closestX = Math.max(rect.x, Math.min(cx, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(cy, rect.y + rect.height));

  const distX = cx - closestX;
  const distY = cy - closestY;
  const distanceSquared = distX * distX + distY * distY;

  // Check if circle center is inside rect
  const inside =
    cx >= rect.x &&
    cx <= rect.x + rect.width &&
    cy >= rect.y &&
    cy <= rect.y + rect.height;

  if (inside) {
    // Find shortest pushout distance to edges
    const leftDist = cx - rect.x;
    const rightDist = rect.x + rect.width - cx;
    const topDist = cy - rect.y;
    const bottomDist = rect.y + rect.height - cy;

    const minDist = Math.min(leftDist, rightDist, topDist, bottomDist);
    if (minDist === leftDist) {
      return { collided: true, normal: { x: -1, y: 0 }, penetration: radius + leftDist };
    } else if (minDist === rightDist) {
      return { collided: true, normal: { x: 1, y: 0 }, penetration: radius + rightDist };
    } else if (minDist === topDist) {
      return { collided: true, normal: { x: 0, y: -1 }, penetration: radius + topDist };
    } else {
      return { collided: true, normal: { x: 0, y: 1 }, penetration: radius + bottomDist };
    }
  }

  if (distanceSquared < radius * radius && distanceSquared > 0.0001) {
    const dist = Math.sqrt(distanceSquared);
    return {
      collided: true,
      normal: { x: distX / dist, y: distY / dist },
      penetration: radius - dist,
    };
  }

  return {
    collided: false,
    normal: { x: 0, y: 0 },
    penetration: 0,
  };
}

/**
 * Resolves player position against multiple walls, allowing smooth sliding along surfaces.
 */
export function resolveWallCollisions(
  player: { x: number; y: number; radius: number; vx: number; vy: number },
  walls: Wall[]
): { collided: boolean; count: number } {
  let anyCollision = false;
  let count = 0;

  // Iterate multiple passes for corner resolution
  for (let pass = 0; pass < 3; pass++) {
    for (const wall of walls) {
      if (wall.isActive === false) continue; // Inactive doors/barriers don't collide

      const result = checkCircleRectCollision(player.x, player.y, player.radius, wall);
      if (result.collided) {
        anyCollision = true;
        count++;

        // Push player out
        player.x += result.normal.x * result.penetration;
        player.y += result.normal.y * result.penetration;

        // Eliminate velocity component going into the wall (slide)
        const dot = player.vx * result.normal.x + player.vy * result.normal.y;
        if (dot < 0) {
          player.vx -= dot * result.normal.x;
          player.vy -= dot * result.normal.y;
        }
      }
    }
  }

  return { collided: anyCollision, count };
}

/**
 * Distance squared between two points.
 */
export function distanceSquared(p1: Vector2D, p2: Vector2D): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return dx * dx + dy * dy;
}

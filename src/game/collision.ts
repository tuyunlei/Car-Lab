
import { MapObject } from './types';
import { PhysicsState } from '../physics/types';

export interface CollisionResult {
    collision: boolean;
    inTargetZone: boolean;
}

export const checkCollisions = (car: PhysicsState, objects: MapObject[]): CollisionResult => {
    // Car radius in meters approx 2.0 (length/2)
    const carRadius = 2.0; 
    let collision = false;
    let inTargetZone = false;

    for (const obj of objects) {
        if (obj.type === 'wall') {
            // Simple AABB for now, assuming objects are axis aligned or simple distance check
            // MapObjects are in Meters now
            const carLeft = car.position.x - carRadius/2; // Width approx
            const carRight = car.position.x + carRadius/2;
            const carTop = car.position.y - carRadius/2;
            const carBottom = car.position.y + carRadius/2;

            const objLeft = obj.x;
            const objRight = obj.x + obj.width;
            const objTop = obj.y;
            const objBottom = obj.y + obj.height;

            if (carRight > objLeft && carLeft < objRight && carBottom > objTop && carTop < objBottom) {
                collision = true;
            }
        } else if (obj.type === 'parking-spot' && obj.target) {
            const centerObjX = obj.x + obj.width / 2;
            const centerObjY = obj.y + obj.height / 2;
            
            const dx = Math.abs(car.position.x - centerObjX);
            const dy = Math.abs(car.position.y - centerObjY);
            
            // Pure spatial check: Is the car roughly centered in the spot?
            // We removed speed/brake checks here. Those belong in LessonRuntime conditions now.
            if (dx < obj.width / 2 - 0.5 && dy < obj.height / 2 - 0.5) {
                inTargetZone = true;
            }
        }
    }

    return { collision, inTargetZone };
};

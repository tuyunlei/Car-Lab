
import { LevelData } from '../game/types';

export const LEVELS: LevelData[] = [
  {
    id: 'lvl1',
    name: 'map.basic.name',
    description: 'map.basic.desc',
    startPos: { x: 5, y: 15 }, 
    startHeading: 0,
    instructions: 'map.basic.inst',
    objects: [
      { id: 'wall_top', type: 'wall', x: 0, y: 7.5, width: 40, height: 0.5, rotation: 0 },
      { id: 'wall_bottom', type: 'wall', x: 0, y: 22.5, width: 40, height: 0.5, rotation: 0 },
      { id: 'target', type: 'parking-spot', x: 24, y: 13.5, width: 5, height: 3, rotation: 0, target: true }
    ],
    environment: { gravity: 9.81, slope: 0 }
  },
  {
    id: 'lvl2',
    name: 'map.parking.name',
    description: 'map.parking.desc',
    startPos: { x: 10, y: 15 },
    startHeading: 0,
    instructions: 'map.parking.inst',
    objects: [
      { id: 'wall_top', type: 'wall', x: 10, y: 5, width: 30, height: 0.5, rotation: 0 },
      { id: 'spot_left', type: 'wall', x: 19, y: 10, width: 0.5, height: 5, rotation: 0 },
      { id: 'spot_right', type: 'wall', x: 22, y: 10, width: 0.5, height: 5, rotation: 0 },
      { id: 'spot_back', type: 'wall', x: 19, y: 10, width: 3.5, height: 0.5, rotation: 0 },
      { id: 'target', type: 'parking-spot', x: 20.5, y: 10, width: 2.5, height: 4.5, rotation: 0, target: true }
    ],
    environment: { gravity: 9.81, slope: 0 }
  },
  {
    id: 'lvl3',
    name: 'map.hill.name',
    description: 'map.hill.desc',
    startPos: { x: 2, y: 15 },
    startHeading: 0,
    instructions: 'map.hill.inst',
    objects: [
        { id: 'wall_top', type: 'wall', x: 0, y: 10, width: 50, height: 0.5, rotation: 0 },
        { id: 'wall_bottom', type: 'wall', x: 0, y: 20, width: 50, height: 0.5, rotation: 0 },
        { id: 'target', type: 'parking-spot', x: 30, y: 13.5, width: 5, height: 3, rotation: 0, target: true }
    ],
    environment: { gravity: 9.81, slope: 0.15 } 
  }
];

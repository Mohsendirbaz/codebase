// matrixFormValues.js
import { atom } from 'jotai';

// Define the versionsAtom
export const versionsAtom = atom({
  active: 'v1',
  list: ['v1'],
  metadata: {
    v1: {
      label: 'Version 1'
    }
  }
});

// Define the zonesAtom
export const zonesAtom = atom({
  active: 'z1',
  list: ['z1'],
  metadata: {
    z1: {
      label: 'Zone 1',
      coordinates: {
        latitude: 0,
        longitude: 0
      },
      assets: []
    }
  }
});
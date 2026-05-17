import { Sphere } from '@unicitylabs/sphere-sdk';
import { createNodeProviders } from '@unicitylabs/sphere-sdk/impl/nodejs';
import { config } from './config.js';

let sphere = null;

export async function getSphere() {
  if (sphere) return sphere;

  const result = await Sphere.init({
    ...createNodeProviders({ network: config.network }),
    mnemonic: config.sphereMnemonic,
    nametag: config.sphereNametag,
  });
  sphere = result.sphere;
  console.log(`Sphere wallet ready: ${config.sphereNametag}`);
  return sphere;
}

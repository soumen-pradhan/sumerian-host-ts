import { greet as coreGreet } from 'hosts-core';

export function greet(): string {
  const core = coreGreet();
  const greet = core + ' Roma Invicta from hosts-three';
  console.log(greet);
  return greet;
}

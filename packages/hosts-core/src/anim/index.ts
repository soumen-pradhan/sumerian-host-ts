import AnimationFeature from './AnimationFeature';
import IStateContainer from './state/IStateContainer';
import IAnimationPlayer from './state/IAnimationPlayer';
import AnimationLayer from './AnimationLayer';

import AbstractState from './state/AbstractState';
import SingleState from './state/SingleState';
import TransitionState from './state/TransitionState';

export {
  AnimationFeature,
  IStateContainer,
  IAnimationPlayer,
  AnimationLayer,
  AbstractState,
  SingleState,
  TransitionState,
};

import type { AnimationTypes } from './AnimationFeature';
import type { AnimationLayerOpts, BlendMode } from './AnimationLayer';

import type { AbstractStateOpts } from './state/AbstractState';
import type { SingleStateOpts } from './state/SingleState';
import type { TransitionStateOpts } from './state/TransitionState';

export type {
  AnimationTypes,
  AnimationLayerOpts,
  BlendMode,
  AbstractStateOpts,
  SingleStateOpts,
  TransitionStateOpts,
};

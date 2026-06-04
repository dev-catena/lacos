let createAgoraRtcEngine = null;
let ChannelProfileType = null;
let ClientRoleType = null;
let RtcSurfaceView = null;
let RtcTextureView = null;
let VideoSourceType = null;
let RenderModeType = null;
let isAgoraAvailable = false;

try {
  const agora = require('react-native-agora');
  createAgoraRtcEngine = agora.createAgoraRtcEngine;
  ChannelProfileType = agora.ChannelProfileType;
  ClientRoleType = agora.ClientRoleType;
  RtcSurfaceView = agora.RtcSurfaceView;
  RtcTextureView = agora.RtcTextureView;
  VideoSourceType = agora.VideoSourceType;
  RenderModeType = agora.RenderModeType;
  isAgoraAvailable = true;
} catch {
  isAgoraAvailable = false;
}

export {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  RtcSurfaceView,
  RtcTextureView,
  VideoSourceType,
  RenderModeType,
  isAgoraAvailable,
};

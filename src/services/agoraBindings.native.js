let createAgoraRtcEngine = null;
let ChannelProfileType = null;
let ClientRoleType = null;
let RtcSurfaceView = null;
let VideoSourceType = null;
let RenderModeType = null;
let isAgoraAvailable = false;

try {
  const agora = require('react-native-agora');
  createAgoraRtcEngine = agora.createAgoraRtcEngine;
  ChannelProfileType = agora.ChannelProfileType;
  ClientRoleType = agora.ClientRoleType;
  RtcSurfaceView = agora.RtcSurfaceView;
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
  VideoSourceType,
  RenderModeType,
  isAgoraAvailable,
};

export default function CallModal({
  callState,
  callType,
  incomingCall,
  localStream,
  remoteStream,
  onAnswer,
  onReject,
  onEnd,
}) {
  if (callState === 'idle') return null;

  const isIncoming = callState === 'incoming';
  const title = isIncoming
    ? `${incomingCall?.fromUsername} is calling (${incomingCall?.callType || 'video'})`
    : callState === 'calling'
      ? 'Calling...'
      : 'In call';

  return (
    <div className="call-overlay">
      <div className="call-modal">
        <h3>{title}</h3>
        <div className="call-videos">
          {remoteStream && (
            <video
              ref={(el) => {
                if (el && remoteStream) el.srcObject = remoteStream;
              }}
              autoPlay
              playsInline
              className="call-video remote"
            />
          )}
          {localStream && callType === 'video' && (
            <video
              ref={(el) => {
                if (el && localStream) el.srcObject = localStream;
              }}
              autoPlay
              playsInline
              muted
              className="call-video local"
            />
          )}
        </div>
        <div className="call-actions">
          {isIncoming ? (
            <>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() =>
                  onAnswer(
                    incomingCall.offer,
                    incomingCall.fromUserId,
                    incomingCall.callType
                  )
                }
              >
                Accept
              </button>
              <button type="button" className="btn btn-danger" onClick={onReject}>
                Decline
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-danger" onClick={onEnd}>
              End call
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

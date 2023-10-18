import { color, Fetch } from '../../utils';
import { Background, Button, RoundButton } from '..';
import React, { CSSProperties, useEffect, useState } from 'react';
import { useGameContext } from '../../contexts';

export function GameInvites() {
  const {
    isInQueue,
    inviteFrom,
    inviteTo,
    cancelGameInvite,
    acceptGameInvite,
    declineGameInvite,
    leaveQueue,
  } = useGameContext();
  const [username, setUsername] = useState<string | undefined>();

  useEffect(() => {
    async function getUsername() {
      if (inviteFrom === inviteTo)
        return setUsername(undefined);
      const id = inviteTo ? inviteTo : inviteFrom;
      setUsername(((await Fetch('user/get_public_profile_by_id/' + id, 'GET'))?.json)?.username);
    }

    getUsername();
  }, [inviteFrom, inviteTo]);

  const mobile = window.innerWidth < 500;

  const inviteStyle: CSSProperties = {
    top: mobile ? 60 : 0,
    right: isInQueue || inviteFrom !== inviteTo ? (mobile ? -30 : 185) : -600,
    minWidth: mobile ? 200 : (inviteTo ? 400 : 550),
    marginLeft: 5,
    position: 'fixed',
    display: 'flex',
    flexDirection: 'row',
    zIndex: 95,
    transition: '1s',
    minHeight: '60px',
    height: '60px',
    borderRadius: 30 + 'px',
    overflow: 'hidden',
  };

  return (
    <div style={inviteStyle}>
      <Background flex_direction={'row'} flex_alignItems={'center'} flex_justifyContent={'space-evenly'}
                  bg_color={color.grey}>
        {inviteTo && (<>
          <p style={{ marginLeft: 10 }}>{'You invited ' + username + ' to Play'}</p>
          <Button onClick={cancelGameInvite}>Cancel</Button>
        </>)}
        {inviteFrom && (<>
          <p style={{ marginLeft: 10 }}>{username + ' invited you to Play: '}</p>
          <RoundButton
            icon={require('../../assets/imgs/icon_accept_invite.png')}
            onClick={() => {
              if (inviteFrom)
                acceptGameInvite(inviteFrom);
            }} />
          <RoundButton
            icon={require('../../assets/imgs/icon_refuse_invite.png')}
            onClick={() => {
              if (inviteFrom)
                declineGameInvite(inviteFrom);
            }} />
          {/*<Button onClick={() => {*/}
          {/*  if (inviteFrom)*/}
          {/*    acceptGameInvite(inviteFrom);*/}
          {/*}}>Accept</Button>*/}
          {/*<Button onClick={() => {*/}
          {/*  if (inviteFrom)*/}
          {/*    declineGameInvite(inviteFrom);*/}
          {/*}}>Decline</Button>*/}
        </>)}
        {isInQueue && (<>
          <p
            style={{ marginLeft: mobile ? 20 : 10 }}>{'Searching for opponent ' + isInQueue + ' game Mode'}</p>
          <Button onClick={leaveQueue}>Cancel</Button>
        </>)}
        <p style={{ minWidth: '30px' }}></p>
      </Background>
    </div>
  );
}
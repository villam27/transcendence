import { useEffect, useState } from 'react';
import { Fetch } from '../../utils';
import { RoundButton } from '../ComponentBase/RoundButton';
import { Button } from '../ComponentBase/Button';
import { IChatUser } from '../../utils/interfaces';
import { ErrorPanel } from '../Error/ErrorPanel';
import { UpdateChannelUsers } from '../../utils/channel_functions';
import { createChatStyle, inputStyle } from './CreateChat';
import { useUserContext } from '../../contexts';

interface Props {
  data: IChatUser | undefined;
  visibility: boolean;
}

export default function ChatUser({ data, visibility }: Props) {
  const [muteTime, setmuteTime] = useState<string>('');
  const [errorVisible, setErrorVisible] = useState<boolean>(false);
  const [errorMessage, seterrorMessage] = useState<string>('Error');
  const { socket } = useUserContext();

  useEffect(() => {
    if (visibility === false) setErrorVisible(false);
  }, [visibility]);

  async function OnProfilClick() {}

  async function execCommand(command: string) {
    const rep = await Fetch(
      'channel/' + command + '/' + data?.channel_id,
      'POST',
      JSON.stringify({
        id: data?.sender_id,
      }),
    );
    if (rep?.json.statusCode === 400) {
      seterrorMessage(rep?.json.message);
      setErrorVisible(true);
    } else {
      if (data?.channel_id) UpdateChannelUsers(data?.channel_id);
    }
  }

  async function OnKick() {
    execCommand('kick');
    const user = data?.sender_id;
    socket?.emit('remove', { user: user });
  }

  async function OnBan() {
    execCommand('ban');
    const user = data?.sender_id;
    socket?.emit('remove', { user: user });
  }

  async function OnUnBan() {
    execCommand('unban');
  }

  async function OnMute() {
    if (muteTime === '') return;
    let isnum = /^\d+$/.test(muteTime);
    if (isnum) {
      const number = Number(muteTime);
      Fetch(
        'channel/mute/' + data?.channel_id,
        'POST',
        JSON.stringify({
          id: data?.sender_id,
          time: number,
        }),
      );
      setmuteTime('');
      return;
    }
    setErrorVisible(true);
    seterrorMessage('mute time is number only');
  }

  async function OnUnMute() {
    execCommand('unmute');
  }

  async function OnAddAdmin() {
    execCommand('add_admin');
  }

  async function OnRemAdmin() {
    execCommand('rem_admin');
  }

  return (
    <div style={createChatStyle}>
      <div style={{ visibility: errorVisible ? 'inherit' : 'hidden' }}>
        <ErrorPanel text={errorMessage}></ErrorPanel>
      </div>
      <h2>
        {data?.sender_username}#{data?.sender_id}
      </h2>
      <RoundButton
        icon_size={100}
        icon={String(data?.sender_urlImg)}
        onClick={OnProfilClick}
      ></RoundButton>
      <Button onClick={OnKick}> Kick </Button>
      <Button onClick={OnBan}> Ban </Button>
      <Button onClick={OnUnBan}> UnBan </Button>
      <p>
        <input
          placeholder="Time in second"
          style={inputStyle}
          value={muteTime}
          onChange={(evt) => {
            setmuteTime(evt.target.value);
          }}
        ></input>
        <Button onClick={OnMute}> Mute </Button>
      </p>
      <Button onClick={OnUnMute}> UnMute </Button>
      <Button onClick={OnAddAdmin}> Add as Admin </Button>
      <Button onClick={OnRemAdmin}> Rem as Admin </Button>
    </div>
  );
}

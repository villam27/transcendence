import { useState } from 'react';
import { Fetch, unsecureFetch } from '../../utils';
import {
  UpdateChannelMessage,
  UpdateChannelUsers,
  SetCurrChan,
} from '../../utils/channel_functions';
import { color } from '../../utils';
import Popup from '../ComponentBase/Popup';
import Settings from '../Settings/settings';
import CreateChat from './CreateChat';

/*
  //  If channel exist just join it and open right pannel
  //  If channel is private just send an error
  //  If channel protected by password, open ask for password pannel
        //  If right ^ go to first option, if not ^ go to second option
  //  If channel not exist open channel creation
    //  In channel creation you can set name, password, type, and directly add users/admin
*/
export function ChatMenu() {
  const [inputValue, setInputValue] = useState<string>('');
  const [settingsVisible, setSettingsVisible] = useState<boolean>(false);
  var current_id = -1;

  //  TODO: clean here
  async function OnJoinChannel() {
    if (inputValue === '') return;
    const path = 'channel/name/' + inputValue;
    const res = await unsecureFetch(path, 'GET');
    if (res?.ok) {
      var data = await res.json();
      current_id = data.id;
      //  Adding user to channel if not in it
      await Fetch(
        'channel/add_user/' + data.id,
        'POST',
        JSON.stringify({
          id: -1, //current user id
        }),
      );
      SetCurrChan(inputValue);
      UpdateChannelMessage(current_id);
      UpdateChannelUsers(current_id);
    } else {
      setSettingsVisible(true);
      //const r = await Fetch(
      //  'channel',
      //  'POST',
      //  JSON.stringify({
      //    channel_name: inputValue,
      //    priv_msg: false,
      //  }),
      //);
      //current_id = r?.json.id;
    }
    setInputValue('');
  }

  return (
    <div style={{
      margin: '30px',
      borderRadius: '10px',
      backgroundColor: color.white,
      height: '60px',
      width: '400px',
    }} className={'text cursor_pointer'}>
      <img style={{ height: '80px', width: '80px', position: 'relative', top: '-10px', left: '-15px' }}
            src={require('../../assets/imgs/icon_search.png')} alt={'search'}/>
      <label>
        <input
          style={{
            outline: 'none',
            borderRadius: '10px',
            border: '0',
            position: 'relative',
            left: '0px',
            top: '-45px',
            height: '55px',
            width: '315px',
            backgroundColor: color.white,
          }}
          placeholder='Search Channel'
          value={inputValue}
          onChange={(evt) => {
            setInputValue(evt.target.value);
          }}
          onKeyDown={(e) => {
            if (e.keyCode !== 13) return;
            OnJoinChannel();
          }}
        />
      </label>
      <Popup isVisible={settingsVisible} setIsVisible={setSettingsVisible}>
        <CreateChat name={inputValue}></CreateChat>
      </Popup>
    </div>
  );
}

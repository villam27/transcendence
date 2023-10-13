import { Fetch } from '.';
import { publish } from './event';

export async function UpdateChannelMessage(id: number) {
  const res2 = await Fetch('channel/msg/' + id, 'GET');
  const msgs = res2?.json;
  if (msgs.statusCode === 400) return;
  publish('enter_chan', {
    detail: {
      value: msgs,
    },
  });
}

export async function UpdateChannelUsers(id: number) {
  const res3 = await Fetch('channel/users/' + id, 'GET');
  const usrs = res3?.json;
  publish('enter_users', {
    detail: {
      value: usrs,
    },
  });
}

export async function UpdateChannels() {
  const res = await Fetch('channel/of_user', 'POST');
  const channels = res?.json;
  publish('update_chan', {
    detail: {
      value: channels,
    },
  });
}

export let current_chan = '';

export async function SetCurrChan(chan: string) {
  current_chan = chan;
}

export async function GetCurrChan() {
  return current_chan;
}

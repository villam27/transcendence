import { useState } from 'react';
import { Background, Border, GroupItems } from '..';
import { color, Viewport } from '../../utils';
import { IUserComplete } from '../../utils/interfaces';
import { ChatMenu } from '../ChanMenu/ChatMenu';

interface Props {
  viewport: Viewport;
  meUser: IUserComplete | undefined;
}

export function ContactPanel({ meUser, viewport }: Props) {
  return (
    <>
      <div style={{ height: viewport.height - 100 + 'px', width: '100%' }}>
        <Background
          flex_gap={'1px 0px'}
          flex_alignItems={'stretch'}
          flex_justifyContent={'flex-start'}
        >
          <GroupItems meUser={meUser} heading={'Friends'} duration_ms={900} />
          <GroupItems meUser={meUser} heading={'Users'} duration_ms={900} />
          <GroupItems meUser={meUser} heading={'Channels'} duration_ms={900} />

          <Border
            borderSize={0}
            height={50}
            borderColor={color.black}
            borderRadius={0}
          >
            <Background
              bg_color={color.grey}
              flex_direction={'row'}
              flex_justifyContent={'flex-end'}
            >
              <h2 style={{ position: 'absolute', left: '5px' }}>Contacts</h2>
            </Background>
          </Border>
        </Background>
      </div>
      <div>{<ChatMenu />}</div>
    </>
  );
}

/*const userElementStyle: CSSProperties = {
  position: 'absolute',
  border: '2px solid red',
  width: '1000px',
  display: 'flex',
  justifyContent: 'space-around',
  background: 'grey',
  color: 'white',
  margin: '10px',
  padding: '10px',
  cursor: 'pointer',
};*/

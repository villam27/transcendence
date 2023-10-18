import { Background, Border, ChatMenu, GroupItems } from '..';
import { color, Viewport } from '../../utils';

interface Props {
  viewport: Viewport;
}

export function ContactPanel({ viewport }: Props) {
  const mobile = viewport.width < 500;

  return (
    <>
      <div style={{ height: viewport.height - 100, width: '100%', paddingTop: mobile ? 60 : 0 }}>
        <Background
          flex_gap={'1px 0px'}
          flex_alignItems={'stretch'}
          flex_justifyContent={'flex-start'}
        >
          <GroupItems heading={'Friends'} duration_ms={900}>

          </GroupItems>
          <GroupItems heading={'Users'} duration_ms={900} />
          <GroupItems heading={'Channels'} duration_ms={900} />
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
      <div>
        <ChatMenu />
      </div>
    </>
  );
}

import { ChannelInfos } from "../../utils/interfaces";
import { Flex, RoundButton } from '..';
import { color } from '../../utils';
import { openChat } from '../../utils/user_functions';

export function ChannelPannel({id, name} : ChannelInfos) {

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            borderRadius: '12.5px',
            backgroundColor: color.grey,
            minWidth: '410px',
            height: '25px',
          }}>
            <Flex zIndex={'10'} flex_direction='row' flex_justifyContent={'space-evenly'}>
            <RoundButton icon={require('../../assets/imgs/icon_chat.png')} onClick={() => console.log("open")}></RoundButton>
            <RoundButton icon={require('../../assets/imgs/icon_leave.png')} onClick={() => console.log("leave")}></RoundButton>
            <RoundButton icon={require('../../assets/imgs/icon_options.png')} onClick={() => console.log("settings")}></RoundButton>
            <p style={{fontSize:"20px"}}>
                {name}
            </p>
            </Flex>
        </div>
    )
}

const imgStyle = {
    width: '100px',
    height: '100px',
    border: '1px solid red',
  };
  
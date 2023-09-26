import { ReactNode, useEffect, useState } from 'react';
import { Background, Border, RoundButton, UserBanner } from '..';
import { color, Fetch } from '../../utils';
import { IUser, IUserComplete } from '../../utils/interfaces';

interface Props {
  children?: ReactNode,
  heading: string,
  duration_ms: number
  meUser: IUserComplete | undefined;
}

export function GroupItems({ children, heading, duration_ms, meUser }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<IUser[]>([]);

  useEffect(() => {
    async function getAllUsers() {
      const users = (await Fetch('user/get_all_public_profile', 'GET'))?.json;
      if (users)
        setAllUsers(users);
    }

    getAllUsers();
  }, [isOpen]);


  const displayFriends = () => {
    console.log('friends list');
    const friends: IUser[] = allUsers.filter(u => meUser?.friends.includes(u.id));

    return friends.map((friend: IUser) => (
        <div key={friend.id}>
          <UserBanner otherUser={friend} meUser={meUser} />
        </div>
      ));
  };

  const displayUsers = () => {
    const others: IUser[] = allUsers.filter(u => u.id !== meUser?.id);

    return others.map((other: IUser) => (
      <div key={other.id}>
        <UserBanner otherUser={other} meUser={meUser} />
      </div>
    ));
  };

  let buttonStyle: React.CSSProperties = {
    rotate: (isOpen ? 0 : 180) + 'deg',
    transition: duration_ms + 'ms ease',
  };

  let groupStyle: React.CSSProperties = {
    paddingTop: isOpen ? '15px' : '0px',
    paddingRight: '5px',
    display: 'flex',
    flexDirection: 'column',
    marginLeft: '50px',
    overflow: 'scroll',
    height: isOpen ? '100%' : '0px',
    gap: '30px',
    transition: duration_ms + 'ms ease',
  };

  return (
    <>
      <Border borderSize={0} height={50} borderColor={color.black} borderRadius={0}>
        <Background bg_color={color.grey} flex_direction={'row'} flex_justifyContent={'flex-end'}>
          <h2 style={{ position: 'absolute', left: '5px' }}>{heading}</h2>
          <div style={buttonStyle}>
            <RoundButton icon={require('../../assets/imgs/side_panel_button.png')} icon_size={40} onClick={() => {setIsOpen(!isOpen)}}></RoundButton></div>
        </Background>
      </Border>
      <div style={groupStyle}>
        { children }
        { isOpen && heading === 'Users' && displayUsers() }
        { isOpen && heading === 'Friends' && displayFriends() }
      </div>
    </>
  );
}

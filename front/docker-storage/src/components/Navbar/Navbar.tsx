import React, {CSSProperties, useEffect, useState} from 'react';
import {GameInvites, Popup, Profil, RoundButton, Settings} from '..';
import Cookies from 'js-cookie';
import {Fetch} from '../../utils';
import {useFriendsRequestContext, useUserContext} from '../../contexts';
import {IUser} from '../../utils/interfaces';
import NotifCard from './notifCard';

const Navbar: React.FC = () => {
  const jwtToken = Cookies.get('jwtToken');
  const [settingsVisible, setSettingsVisible] = useState<boolean>(false);
  const [profilVisible, setProfilVisible] = useState<boolean>(false);
  const {user, socket} = useUserContext();
  const [notifsVisible, setNotifsVisible] = useState<boolean>(false);
  const {recvInvitesFrom} = useFriendsRequestContext();
  const [notifs, setNotifs] = useState<Array<IUser>>([]);

  const showNotif = () => {
    setNotifsVisible(!notifsVisible);
  };

  const logout = async () => {
    const res = await fetch('http://localhost:3001/api/user/logout', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'appsetNotifsVisiblelication/json',
        Authorization: `Bearer ${jwtToken}`,
      },
    });
    if (res.ok) {
      Cookies.remove('jwtToken');
      window.location.replace('/login');
    } else {
      console.log(res.status);
    }
    socket?.disconnect();
    Cookies.remove('jwtToken');
    window.location.replace('/login');
  };

  // delog the user if he close the navigator without click in logout button
  useEffect(() => {
    const handleBeforeUnload = () => {
      logout();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
    // eslint-disable-next-line
  }, [profilVisible]);

  useEffect(() => {
    const setNotif = async () => {
      const tmp = recvInvitesFrom.map(async (from) => {
        return (await Fetch(`user/get_public_profile_by_id/${from}`, 'GET'))?.json;
      });
      try {
        if (!tmp) {
          setNotifsVisible(false);
          return;
        }
        const res = await Promise.all(tmp);
        setNotifs(res as IUser[]);
      } catch (e) {
        console.log(e);
      }
    };
    setNotif();
  }, [recvInvitesFrom]);

  return (
    <>
      <div style={navbarStyle}>
        <div>
          <div style={{display: 'flex', background: 'black', borderRadius: '0 0 0 30px'}}>
            {notifs.length > 0 && <div style={notifbadge}>{notifs.length}</div>}
            <RoundButton
              icon={require('../../assets/imgs/icon_notif.png')}
              icon_size={50}
              onClick={() => showNotif()}
            />
            <RoundButton
              icon={user?.urlImg ? user.urlImg : require('../../assets/imgs/icon_user.png')}
              icon_size={50}
              onClick={() => setProfilVisible(!profilVisible)}
            />
            <RoundButton
              icon={require('../../assets/imgs/icon_setting.png')}
              icon_size={50}
              onClick={() => setSettingsVisible(!settingsVisible)}
            />
            <RoundButton
              icon={require('../../assets/imgs/icon_logout.png')}
              icon_size={50}
              onClick={() => logout()}
            />
          </div>
          {notifsVisible &&
              <div style={notifstyle}>
                {notifs.map((notif) => (
                  <NotifCard notif={notif} otherUser={notif} key={notif.id}/>
                ))}
              </div>}
          <Popup isVisible={settingsVisible} setIsVisible={setSettingsVisible}>
            <Settings isVisible={settingsVisible}/>
          </Popup>
          <Popup isVisible={profilVisible} setIsVisible={setProfilVisible}>
            <Profil otherUser={user}/>
          </Popup>
        </div>

      </div>
      <GameInvites/>
      <Popup isVisible={settingsVisible} setIsVisible={setSettingsVisible}>
        <Settings isVisible={settingsVisible}/>
      </Popup>
      <Popup isVisible={profilVisible} setIsVisible={setProfilVisible}>
        <Profil otherUser={user}/>
      </Popup>
    </>
  );
};

const mobile = window.innerWidth < 500;

const navbarStyle: CSSProperties = {
  top: 0,
  right: 0,
  position: 'fixed',
  display: 'flex',
  flexDirection: 'row-reverse',
  borderRadius: '30px',
  zIndex: 111,
};

const notifbadge: CSSProperties = {
  position: 'absolute',
  width: '20px',
  height: '20px',
  top: '20px',
  background: 'red',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  alignContent: 'center',
};

const notifstyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  position: 'absolute',
  right: mobile ? 0 : 200,
  minHeight: '100%',
  background: 'black',
};

export default Navbar;

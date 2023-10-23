import { GameHistory, IUser } from '../../utils/interfaces';
import React, { useEffect, useState } from 'react';
import { UserButton } from '../User/UserButton';
import { useUserContext } from '../../contexts';
import { Flex, Popup } from '../index';
import { useUIContext } from '../../contexts/UIContext/UIContext';
import { Fetch } from '../../utils';
import GameHistoryBanner from './GameHistoryBanner';


export default function Profil() {
  const { isProfileOpen, setIsProfileOpen } = useUIContext();
  const { id, user } = useUserContext();
  const [games, setGames] = useState<GameHistory[]>([])
  const mobile = window.innerWidth < 500;
  const [profilUser, setProfilUser] = useState<IUser | undefined>(undefined);



  useEffect(() => {
    async function setProfil() {
      const profil = (await Fetch('user/get_public_profile_by_id/' + isProfileOpen, 'GET'))?.json;
      if (profil)
        return setProfilUser(profil);
      return setProfilUser(undefined);
    }

    if (isProfileOpen === 0)
      return setProfilUser(undefined);
    if (isProfileOpen === id)
      return setProfilUser(user);
    setProfil();
  }, [isProfileOpen]);

  const profilContainer: React.CSSProperties = {
    borderRadius: '10px',
    padding: mobile ? 15 : 20,
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    background: '#00375C',
    height: '100%',
    color: 'white',
    margin: mobile ? 5 : 10,
    cursor: 'pointer',
    minWidth: '300px',
  };

  useEffect(() => {
    if (user)
      getGames();
  }, [user]);

  const imgStyle = {
    width: '200px',
    borderRadius: '5px',
    border: '2px solid',
  };

  const statusStyle = {
    width: '10px',
    height: '10px',
  };

  async function getGames()
  {
    const tmp: { gameHist: GameHistory[] } = (await Fetch('Game/get_game/' + user?.id, 'GET'))?.json;
    setGames(tmp.gameHist);
    console.log(tmp.gameHist);
  }

  if (isProfileOpen === 0)
    return (<></>);

  return (
    <Popup isVisible={isProfileOpen !== 0} onClose={() => setIsProfileOpen(0)}>
      <div style={profilContainer}>
        {mobile ?
          <h3>{profilUser?.username}</h3> :
          <h2>{profilUser?.username}</h2>
        }
        <Flex flex_direction='row'>
        <div style={{alignItems:'center'}}>
        <img style={imgStyle} src={profilUser?.urlImg} alt={'user'} />
        <img style={isProfileOpen !== id ? statusStyle : (profilUser?.user_status ? statusStyle : imgStyle)}
             src={profilUser?.user_status === 'on' ? require('../../assets/imgs/icon_green_connect.png') :
               require('../../assets/imgs/icon_red_disconnect.png')}
             alt={profilUser?.user_status === 'on' ? 'connected' : 'disconnected'} />
        </div>
          <div style={{marginLeft:'50px'}}>
            <div style={{flexDirection:'row', display:'flex'}}>
              <p style={{minWidth:'13ch'}}>Rank </p> <p> : {user?.elo}</p>
            </div>
            <div style={{flexDirection:'row', display:'flex'}}>
              <p style={{minWidth:'13ch'}}>Elo </p><p>: {user?.elo}</p>
            </div>
            <div style={{flexDirection:'row', display:'flex'}}>
              <p style={{minWidth:'13ch'}}>Winrate</p><p> : {user?.winrate} %</p>
            </div>
            <div style={{flexDirection:'row', display:'flex'}}>
              <p style={{minWidth:'13ch'}}>Games played </p><p> : {user?.gamesPlayed}</p>
            </div>
          </div>
        </Flex>
        <hr style={{ width: '100%' }} /> 
        <div>
          <p style={{
            display: 'flex',
            justifyContent: 'space-evenly',
            margin: '10px 0',
            padding:'1px 0',
            fontSize:'40px'
          }}>MATCH HISTORY</p>
          <div style={{
            display: 'flex',
            justifyContent: 'space-evenly',
            margin: '1px 0',
          }}>
            <Flex flex_alignItems="center">
              <p style={{fontSize:'25px', paddingRight:'30px', paddingLeft:'30px', minWidth: '8ch', textAlign:'center'}}>You</p>
            </Flex>
            <Flex flex_alignItems="center">
              <p style={{fontSize:'25px', paddingRight:'30px'}}>Elo</p>
            </Flex>
            <Flex flex_alignItems="center">
              <p style={{fontSize:'35px', paddingRight:'30px'}}>Score</p>
            </Flex>
            <Flex flex_alignItems="center">
              <p style={{fontSize:'25px', paddingRight:'30px'}}>Elo</p>
            </Flex>
            <Flex flex_alignItems="center">
              <p style={{fontSize:'25px', paddingRight:'30px'}}>Opponent</p>
            </Flex>
          </div>
        </div>
        <div  style={{maxHeight: '400px',overflowY: 'scroll'}}>
          {games.map((game)=>(
              <GameHistoryBanner game={game} key={game.id}/>
          ))}
        </div>
        {isProfileOpen !== id && profilUser && <UserButton otherUser={profilUser} />}
      </div>
    </Popup>
  );

}


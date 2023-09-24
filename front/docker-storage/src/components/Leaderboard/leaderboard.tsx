import { useEffect, useState } from 'react';
import Profil from '../Profil/profil';
import { AuthGuard } from '..';
import { LeaderboardProps, User, UserInfos } from '../../utils/interfaces';
import { Fetch } from '../../utils';

export function Leaderboard({ searchTerm, isVisible }: LeaderboardProps) {
  const [userElements, setUserElements] = useState<JSX.Element[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [profilVisible, setProfilVisible] = useState<boolean>(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [userInfos, setUserInfos] = useState<UserInfos>();

  const handleOpenProfil = (user: User) => {
    // open profil card
    setSelectedUser(user);
    setProfilVisible(true);
  };

  const closeProfil = () => {
    // close profil card
    setSelectedUser(null);
    setProfilVisible(false);
  };

  const getAllProfil = async () => {
    let cancelled = false;
    const users = (await Fetch('user/get_all_public_profile', 'GET'))?.json;
    // console.log(cancelled); // si on print en Slow 3g on a : 2xtrue si on cancell, et 1 true 1 false si on cancell pas
    if (cancelled) {
      // au cas ou le client cancell le fetch avant la fin
      return;
    } else {
      if (users && Array.isArray(users) && users.length === 0) // A TESTER
        setErrorMessage('Aucun utilisateur trouvé.');
      else
        setAllUsers(users);
    }
    return () => {
      cancelled = true;
    };
  };

  useEffect(() => {
    const getUserInfos = async () => {
      getAllProfil();
      const user = (await Fetch('user', 'GET'))?.json;
      if (!user) return;
      setUserInfos(user);
    };
    getUserInfos(); // appel de la fonction si le jwt est good
  }, [isVisible]);

  // Filtrer et trier les users en fonction de searchTerm lorsque searchTerm change
  const displayAllProfil = () => {
    const filteredUsers = allUsers
      .filter((user: User) =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      .sort((a: User, b: User) => a.username.localeCompare(b.username)); // alphabetic. Change to winrate sort
    let count = 1;
    const elements = filteredUsers.map((user: User) => (
      <div key={user.id} style={userElementStyle}>
        <p>RANK : {count++}</p> {/* TO CHANGE */}
        {user.id === userInfos?.id ? (
          <>
            {/* <p onClick={() => handleOpenProfil(user)}> ===> go to own profil ?? */}
            <p>coucou cest moi : {user.username}</p>
            {/* </p> */}
            <img style={imgStyle} src={user?.urlImg} alt={'user\'s profile picture'}/>
            <p>winrate : {user.winrate}</p>
          </>
        ) : (
          <>
            <p onClick={() => handleOpenProfil(user)}>
              Nom d'utilisateur : {user.username}
            </p>
            {user.is_friend ? <p>Is a friend</p> : <></>}
            <img style={imgStyle} src={user?.urlImg} alt={'user\'s profile picture'}/>
            <p>Status : {user.user_status}</p>
            <p>winrate : {user.winrate}</p>
          </>
        )}
      </div>
    ));
    setUserElements(elements);
  };

  useEffect(() => {
    displayAllProfil();
  }, [searchTerm, allUsers]);

  return (
    <div style={container}>
      leaderboard
      {errorMessage && (
        <div style={{ color: 'red', marginTop: '5px' }}>{errorMessage}</div>
      )}
      <div className='container'>{userElements}</div>
      {profilVisible && (
        <AuthGuard isAuthenticated>
          <Profil user={selectedUser} onClose={closeProfil} />
        </AuthGuard>
      )}
    </div>
  );
}

const container = {
  border: '1px solid red',
  height: '1000px',
  display: 'flex',
  justifyContent: 'center',
};

const imgStyle = {
  width: '100px',
  height: '100px',
  border: '1px solid red',
};

const userElementStyle = {
  width: '900px',
  display: 'flex',
  justifyContent: 'space-around',
  background: 'grey',
  border: '1px solid black',
  color: 'white',
  margin: '10px',
  padding: '10px',
  cursor: 'pointer',
};

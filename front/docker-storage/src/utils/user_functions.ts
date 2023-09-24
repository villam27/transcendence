import { Fetch } from "./SecureFetch";
import { IUser } from "./interfaces";
import Cookies from 'js-cookie';

export function openChat() {
    // console.log('open chat with ' + user_name);
}

export function sendGameInvite() {
    // console.log('invite ' + user_name + ' to play a game');
}

export function lookGame() {
    // console.log('try to look game with ' + user_name);
}


export const sendFriendInvite = (id: number | undefined, jwtToken: string | undefined) => {
    fetch(`http://localhost:3001/api/user/demand/${id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${jwtToken}`,
        },
    })
        .then((response) => {
            if (response.ok) {
                //   setSendButton(true);
            } else if (response.status === 404) {
                throw new Error(`Le user d'id ${id} n'existe pas.`);
            } else if (response.status === 409) {
                throw new Error(`Vous avez déjà demandé le user ${id}.`);
            }
        })
        .catch((error) => {
            console.log('Erreur 500:', error);
        });
    // console.log('send friend invite to ' + user_name);
};

export async function blockAUser(id: number) {
    const jwtToken = Cookies.get('jwtToken');
    try {

        const res = await fetch(`http://localhost:3001/api/user/block/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${jwtToken}`,
            },
        })
        if (res.ok)
            console.log(`user ${id} blocked`);
        else
            console.log(`user ${id} already blocked`);
    } catch (e) {
        console.log(e);
    }
}

export const handleOpenProfil = (setSelectedUser:any, setProfilVisible:any, user: IUser) => {
    // open profil card
    setSelectedUser(user);
    setProfilVisible(true);
  };
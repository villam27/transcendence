import Cookies from 'js-cookie';

export async function Fetch(url_end: string, method: 'GET' | 'PATCH' | 'POST', body: any = undefined): Promise<undefined | { response: Response, json: any }> {
  const jwtToken = Cookies.get('jwtToken');
  try {
    const response = await fetch('http://localhost:3001/api/' + url_end, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwtToken}`,
      },
      body: body
    })
    if (response.ok) {
      const rep_json = await response.json();
      return { response: response, json: rep_json };
    } else {
      console.error('You have been disconnected \n(your Authorisation Cookie has been modified or deleted)');
      //window.location.href = '/login';
      console.log(await response.json());
    }
  } catch (e) {
    console.log(e);
    console.error('You have been disconnected \n(your Authorisation Cookie has been modified or deleted)');
    //window.location.href = '/login';  TODO: remove before pull request its only for test
  }
}

export async function unsecureFetch(
  url_end: string,
  method: 'GET' | 'PATCH' | 'POST',
  body: any = undefined,
): Promise<undefined | Response> {
  let response;
  try {
    response = await fetch('http://localhost:3001/api/' + url_end, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body,
    });
    return response;
  } catch (e) {
    console.warn(e);
    return;
  }
}

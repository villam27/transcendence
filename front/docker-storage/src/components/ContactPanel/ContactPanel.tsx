import Cookies from "js-cookie";
import { Border, Background, GroupItems, SearchBar, UserBanner } from "..";
import { color } from "../../utils/Global";
import { Viewport } from "../../utils/Viewport";
import { IUser, IUserComplete } from "../../utils/interfaces";
import { useNavigate } from "react-router-dom";
import { CSSProperties, useEffect, useState } from "react";

interface Props {
	viewport: Viewport,
	meUser: IUserComplete | undefined;
}

export function ContactPanel({ meUser, viewport }: Props) {

	return (
		<>
			<div style={{ height: viewport.height - 100 + 'px', width: '100%' }}>
				<Background flex_gap={'1px 0px'} flex_alignItems={'stretch'} flex_justifyContent={'flex-start'}>

					<GroupItems meUser={meUser} heading={'Friends'} duration_ms={900}/>
					<GroupItems meUser={meUser} heading={'Groups'} duration_ms={900}/>
					<GroupItems meUser={meUser} heading={'Last Chat'} duration_ms={900}/>

					<Border borderSize={0} height={50} borderColor={color.black} borderRadius={0}>
						<Background bg_color={color.grey} flex_direction={"row"} flex_justifyContent={'flex-end'}>
							<h2 style={{ position: 'absolute', left: '5px' }}>Contacts</h2>
						</Background>
					</Border>
				</Background>
			</div>
			{/* <SearchBar>Search for friend or group here..</SearchBar> */}
		</>
	);
}

const userElementStyle: CSSProperties = {
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
};

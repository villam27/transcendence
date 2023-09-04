import {color} from "../../Global";
import {SidePanel} from "../SidePanel/SidePanel";
import Background from "../Background/Background";
import {Button} from "../Button/Button";
import React from "react";
import { Viewport } from "../../app/Viewport";
import { ContactPanel } from "../ContactPanel/ContactPanel";
import { ChatPanel } from "../ChatPanel/ChatPanel";
import { Input } from "../Input/Input";
import { SearchBar } from "../SearchBar/SearchBar";

interface Props{
    panelWidth:number
    viewport: Viewport
}

export function MainPage({panelWidth, viewport}:Props)
{
    return (
        <>
            <Background bg_color={color.clear} flex_direction={'row'} flex_justifyContent={"space-between"} flex_alignItems={'stretch'}>
                <SidePanel viewport={viewport} width={panelWidth} isLeftPanel={true} duration_ms={900}>
                    <Background flex_justifyContent={'flex-start'}>
                        <ContactPanel viewport={viewport}></ContactPanel>
                    </Background>
                </SidePanel>
                <Background bg_color={color.clear} flex_justifyContent={'space-around'}>
                    <SearchBar>Leader Board..</SearchBar>
                    <Button onClick={() => console.log('play clicked')}>
                        Play
                    </Button>
                    <br/>
                </Background>
                <SidePanel viewport={viewport} width={panelWidth} isLeftPanel={false} duration_ms={900}>
                    <Background>
                        <ChatPanel></ChatPanel>
                    </Background>
                </SidePanel>
            </Background>
        </>
    );
}
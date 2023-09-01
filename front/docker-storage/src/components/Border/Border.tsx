import "../../app/App.css"
import { color } from '../../Global'
import {ReactNode} from "react";

interface Props {
    children?: ReactNode
    borderRadius?: number;
    borderSize?: number;
    borderColor?: string;
    height?: number;
    width?: number
}

export function Border({children, borderRadius = 5, borderSize = 2, borderColor = color.white, width = 0, height = 0}: Props)
{
    const style = {
        width: width === 0 ? '' : width + 'px',
        height: height === 0 ? '' : height + 'px',
        display: "flex",
        borderRadius: borderRadius + 'px',
        overflow:'hidden',
        border:'solid ' + borderColor + ' ' + borderSize + 'px'
    }

    return (
        <div style={style}>
            {children}
        </div>
    );
}
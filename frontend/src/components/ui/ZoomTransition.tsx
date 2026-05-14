import { forwardRef } from "react";
import { Zoom } from "@mui/material";
import type { TransitionProps } from "@mui/material/transitions";

const ZoomTransition = forwardRef(function ZoomTransition(
    props: TransitionProps & { children: React.ReactElement },
    ref: React.Ref<unknown>,
) {
    return <Zoom ref={ref} {...props} />;
});

export default ZoomTransition;

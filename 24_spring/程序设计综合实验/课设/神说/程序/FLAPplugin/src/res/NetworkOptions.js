import {Hex} from "./HexColors";

export const NetworkOptions = (height,width)=> {
    return {
    autoResize: true,
    height: height,
    width: width,
    locale: "en",
        nodes: {
      physics: false,
      label: undefined,
      title: undefined,
      shape: "circle",
          
      borderWidth: 1,
  
      scaling: {
        label: {
          enabled: true
        }
      },
      chosen: false,
  
      color: {
       border: Hex.NodeBorder,
        background:Hex.NodeInner, 
        highlight: {
          border: Hex.NodeBorder,
          background: Hex.NodeInner
        },
        hover: {
          border: Hex.NodeBorder,
          background: Hex.NodeInner
      
        }
      },
      font: {
        color:Hex.NodeInnerText,
        face: "sans serif",
        strokeWidth: 2,
        strokeColor: Hex.NodeInnerTextStroke,
        size: 13,
        bold: {
          face: "sans serif",
          size: 20
        }
      }
    },
    edges: {
      physics: true,
  
      color: Hex.EdgeColor,
      scaling: {
        label: true
      },
      chosen: false,
      font: {
        color: Hex.EdgeInnerText,
        size: 16,
        strokeWidth: 3,
        strokeColor: Hex.EdgeInnerTextStroke
      }
    },
    interaction: {
      hover: true
    }
  };
}
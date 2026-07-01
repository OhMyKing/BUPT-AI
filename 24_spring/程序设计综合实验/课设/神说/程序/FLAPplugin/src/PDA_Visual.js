import React, { useEffect, useRef, useState, useContext } from "react";
import vis from "vis-network";
import { Button, ButtonGroup, Col, Row, Modal,Badge} from "react-bootstrap";
import "./App.css";
import "./Visual.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { AutomataContext } from "./AutomataContext.js";
import accept_bar from "./accept.svg";
import add_bar from "./add-bar.svg";
import points_bar from "./points.svg";
import reject_bar from "./reject.svg";
import transition_bar from "./transition.svg";
import blank_svg_bar from "./blank.svg";
import passive_bar from "./delete.svg";
import remove_bar from "./remove.svg";
import add_perfect from "./plus.svg";

import { NetworkOptions } from "./res/NetworkOptions";
import { Hex } from "./res/HexColors";
let node_id_global = 0;
let height = window.innerHeight - 85;
let nodesDS = new vis.DataSet([]);
let edgesDS = new vis.DataSet([]);
let in_initial_mode = false;
let in_accepting_mode_ = false;
let delete_lock = false;
 let inputVal = "";
let edgeDeletion = false;

let graph = { nodes: nodesDS, edges: edgesDS };

function PDA_Visual() {
  const [show, setShow] = useState({display: false, user_in: " _"});
  const [warning, setWarningDisplay] = useState({on:false, message: "Incorrect input"});
  const [modalEntry,setModalEntries] = useState([["","",""]])
  const master_context = useContext(AutomataContext);
  master_context.graphObj = graph;
  master_context.edgesDS = edgesDS;
  master_context.nodesDS = nodesDS;
  let img_index = 0;
  let img_array = [
    blank_svg_bar,
    accept_bar,
    add_bar,
    points_bar,
    reject_bar,
    transition_bar,
  ];

  const wrapper = useRef(null); //Display graph in div "wrapper"
  const img_status = useRef(null);
  let network;

  useEffect(() => {
    img_status.current.src = passive_bar;
    master_context.PDA = true
    let nav_header_height = document.querySelector("#nav-header") == null ? 0 : document.querySelector("#nav-header").offsetHeight;
    let bar_layout_height = document.querySelector("#bar_layout") == null ? 0 : document.querySelector("#bar_layout").offsetHeight;

    network = new vis.Network(
      wrapper.current,
      graph,
      NetworkOptions((height - nav_header_height - bar_layout_height ).toString(), window.innerWidth.toString())
    );
    master_context.network = network;
    network.on("showPopup", (params) => { });
    network.on("hoverNode", (params) => { });
    network.on("controlNodeDragEnd", (params) => {
      network.disableEditMode();
      let edge_identifier = findEdgeByNodes(
        params.controlEdge.from,
        params.controlEdge.to
      );

      edgesDS.update([{ id: edge_identifier, arrows: "to" }]);
    });

    network.on("afterDrawing", (params) => {
      let canvasDOM = document.getElementsByTagName("canvas")[0];
      canvasDOM.style.background = Hex.Canvas;
      if (master_context.hasImported) {
        nodesDS = master_context.nodesDS;
        edgesDS = master_context.edgesDS;
        master_context.hasImported = false;
        graph = master_context.graphObj;
        node_id_global += nodesDS.get().length -1
      }
      document.getElementById("group-holder").style.borderColor = Hex.Canvas;
      document.getElementById("non-header-div").style.background = Hex.Canvas;
    });

    const emptyCanvasClickHandler = (params) => {
      let addedNode = node_id_global;
      const noNodesClicked = (params) =>
        params.nodes.length === 0 ? true : false;
      const noEdgesClicked = (params) =>
        params.edges.length === 0 ? true : false;
      const BoundsCheck = (params) =>
        params.pointer.canvas.x != undefined || params.pointer.canvas.y != null;
      const getXY = (params) => [
        params.pointer.canvas.x,
        params.pointer.canvas.y,
      ];
      const [x, y] = BoundsCheck(params) ? getXY(params) : [null, null];
      const populateNodeAt = (x, y) => {
        node_id_global += 1;
        nodesDS.add([{ id: node_id_global, label: newNodeLabel() }]);
        network.moveNode(node_id_global, x, y);
      };
      let _ =
        noNodesClicked(params) &&
          noEdgesClicked(params) &&
          x != null &&
          y != null
          ? populateNodeAt(x, y)
          : () => {
            return;
          };
      return addedNode != node_id_global ? true : false;
    };

    const deleteNodeWithCtrl = (params) => {
      if (params.event.srcEvent.ctrlKey || params.event.srcEvent.metaKey) {

        network.deleteSelected();
        return true;
      }
      return false;
    };

    network.on("release", (p) => {
      img_status.current.src = passive_bar;
    });

    const handleShiftClick = (event) => {
      if (event.key === "Shift") {
        toEditEdgeMode({});
      }
    };

    window.addEventListener("keydown", (e) => {
      const deleteNodeMode = (keyCode) => {
        if (keyCode === "KeyD") {
          try {
            img_status.current.src = remove_bar;
          }
          catch (e) {
          }
          delete_lock = true;
          return;
        }
        else if (keyCode == "KeyT") {
          toEditEdgeMode();
          return;
        }
        else {
          delete_lock = false;
          if (img_status != null && img_status.current != null) {
            img_status.current.src = passive_bar;
          }
          return;
        }
      };
      deleteNodeMode(e.code);
    });

    network.on("click", (params) => {
      if (edgeDeletion) {
        edgeDeletion = false;
        return;
      }
      else if (delete_lock && network.getSelectedNodes().length != 0) {
        network.deleteSelected();
        deselectAllModes()
        return;
      }
      else if (delete_lock && params.edges) {
        graph.edges.remove(params.edges[0])
        deselectAllModes();
        return;
      }

      deselectAllModes();
      emptyCanvasClickHandler(params) || deleteNodeWithCtrl(params);
    });

    network.on("select", (params) => {
      if (delete_lock && params.edges.length > 0 && (params.nodes.length == 0 || params.nodes == [])) {
        edgeDeletion = true;
        graph.edges.remove(params.edges[0]);
        deselectAllModes();
      }
      else if (
        params != null &&
        in_initial_mode &&
        (params.nodes > 0 || params.nodes[0] != null)
      ) {
       let node_id_clicked = params.nodes[0];
        let found_node;

        graph.nodes.get().forEach((node) => {
          if (node.id == node_id_clicked) {
            found_node = node;
          }
        });
        in_initial_mode = false;
        img_status.current.src = passive_bar;
        let final_state;
        let circle_config = "circle";
        let triangle_config = "triangle";
        if (found_node.shape == circle_config || found_node.shape == null) {
          final_state = triangle_config;
        } else {
          final_state = circle_config;
        }
        if (found_node.init == true) {
          nodesDS.update([
            { id: found_node.id, shape: final_state, init: false },
          ]);
        } else {
          nodesDS.update([
            { id: found_node.id, shape: final_state, init: true },
          ]);
        }
      }
      else if (
        params != null &&
        params.nodes != null &&
        in_accepting_mode_ &&
        (params.nodes > 0 || params.nodes[0] != null)
      ) {
        let found_node;
        let node_id_clicked = params.nodes[0];
        graph.nodes.get().forEach((node) => {
          if (node.id == node_id_clicked) {
            found_node = node;
          }
        });
        let final_border = 3;
        let border_width_a = 3;
        let border_width_b = 1;
        if (found_node.borderWidth == border_width_a) {
          final_border = border_width_b;
        } else {
          final_border = border_width_a;
        }
        nodesDS.update([{ id: node_id_clicked, borderWidth: final_border }]);
        in_accepting_mode_ = false;
        img_status.current.src = passive_bar;
      } else if (params.edges.length == 1 && params.nodes == 0 && edgeDeletion == false) {
        let edge_id = params.edges[0];
        const openModal = (edgeDisplayInfo) => {
          if (edgeDisplayInfo == null) {
            setShow({ display: true, user_in: "!" });
            return;
          }
          let from = edgeDisplayInfo.from, to = edgeDisplayInfo.to;
          let currentEdgeText = edgeDisplayInfo.edgeLabel == null ? "" : edgeDisplayInfo.edgeLabel;
          inputVal = currentEdgeText
          setShow({ display: true, from: "δ(" + from.trim() + ", ", edgeLabel: currentEdgeText, to: ") =" + to, edgeId: edge_id });
          let edges = nodesOfEdgeId(params.edges[0])
          let newArr = [["","",""]]
          if (edges.edgeLabel) {
            newArr = []
            edges.edgeLabel.replace(/ /g,'').split("|").forEach((triple) => {
              let read = triple[0]
              let pop = triple[2]
              let push = triple[5]
              let subArr = [read, pop, push]
              newArr.push(subArr)
            })
          }
            setModalEntries([...newArr]);
        }
          openModal(nodesOfEdgeId(params.edges[0]))
      }
    });

    return () => {
      network.off("select");
      network.off("controlNodeDragEnd");
      network.off("hoverNode");
      network.off("showPopup");
      master_context.PDA = false
      network.destroy();
      window.removeEventListener("keydown", (e) => {
        const deleteNodeMode = (keyCode) => {
          if (keyCode === "KeyD") {
            img_status.current.src = remove_bar;
            delete_lock = true;
            return;
          }
          else if (keyCode == "KeyT") {
            toEditEdgeMode();
            return;
          }
          else {
            delete_lock = false;
            if (img_status != null && img_status.current != null) {
              img_status.current.src = passive_bar;
            }
            return;
          }
        };
        deleteNodeMode(e.code);
      });
  
      window.removeEventListener("keydown", handleShiftClick);
    };
  },[]);



  const deselectAllModes = () => {
    in_accepting_mode_ = false;
    in_initial_mode = false;
    delete_lock = false;
    if (img_status != null && img_status.current != null) {
      img_status.current.src = passive_bar
    }
  };
  const nodesOfEdgeId = (edgeID) => {
    let fromLabel = "", toLabel = "", edgeText = "";
    let nodeFromId, nodeToId;

     graph.edges.forEach((edge) => {
      if (edge.id == edgeID) {
        nodeFromId = edge.from
        nodeToId = edge.to
        edgeText = edge.label;
      }
    });
    graph.nodes.forEach((node) => {
      if (node.id == nodeFromId) {
        fromLabel = node.label;
      }
      if (node.id == nodeToId) {
        toLabel = node.label;
      }
    });
    return {edgeLabel: edgeText , from: fromLabel, to:toLabel }
  }
  const ChangeEdgeText = (userInput, edgeID) => {
    
    String.prototype.replaceAt = function (index, replacement) {
      return this.substr(0, index) + replacement + this.substr(index + replacement.length);
    }
    let warn = false;
    let finalStr = []
    let warnString = ""
    modalEntry.forEach((arr) => {
      arr = arr.map(str => {
        if (!str) {
          return ""
        }
        else {
          return str
        }
      }) 
      let testEmptyEntry = arr.filter(str=>  str.length == 0 )
      if ((arr.includes("") && testEmptyEntry.length != 3)) {
        warn = true
        warnString = "不符合规则"
        return
      }
      else if (arr.filter(str => str ?  str.length > 1 : false).length > 0) {
        warn = true
        warnString = "每个文本框请输入一个字符"
      }

      if (testEmptyEntry.length== 3) {
        return
      }
      arr = arr.map((str) => str.replace("!", "ϵ").replace(" ", "ϵ"))
      let newStr = arr[0] + "," + arr[1] + "->" + arr[2]
      finalStr.push(newStr);
    });
    if (warn) {
      setWarningDisplay({ on: true , message:warnString});
    }
    else {
      graph.edges.forEach((edge) => {
        if (edge.id == edgeID) {
          edge.label = finalStr.join("|");
          edgesDS.update([{id:edge.id, label: finalStr.join(" | ")}])
        }
      });
      setShow({ display: false })
      setWarningDisplay({on:false, message:""})
      deselectAllModes()
    }
  }

  const findEdgeByNodes = (from, to) => {
    let return_id;
    graph.edges.forEach((edge, index) => {
      if (to == edge.to && edge.from == from) {
        return_id = edge.id;
      }
    });
    return return_id;
  };
  function toEditEdgeMode(props) {
    deselectAllModes();
    try {
      img_status.current.src = transition_bar;
      if (network == null) return;
      network.enableEditMode();
      network.addEdgeMode();
    }
    catch (e) {

    }
  }
//
  function setInitial(props) {
    deselectAllModes();
    img_status.current.src = points_bar;

    in_initial_mode = true;
  }
  function setAccepting(props) {
    deselectAllModes();
    img_status.current.src = accept_bar;

    in_accepting_mode_ = true;
  }

  const newNodeLabel = () => {
    let returnLabel = " Q ";
    let nominalAppend = nodesDS.get().length.toString();
    const parseLabel = (label) => parseInt(label.replace(returnLabel, ""), 10);
    let foundEmptyIndex = false;
    let nodesPresent = nodesDS
      .get()
      .map((obj) => {
        return parseLabel(obj.label);
      })
      .sort((a, b) => a - b);
    nodesDS.get().forEach((obj, index) => {
      if (nodesPresent[index] != index && !foundEmptyIndex) {
        nominalAppend = index.toString();
        foundEmptyIndex = true;
        return;
      }
    });
    return (returnLabel += nominalAppend).length == 4
      ? (returnLabel += " ")
      : returnLabel;
  };
  function StackModalEntry(props) {
    return (
        <Row>
        <Col md={{offset: 1}}>
          <input type="text" onChange={(event) => { modalEntry[props.index][0] = event.target.value }} defaultValue={modalEntry[props.index][0]}size="1" />
          <b>{","} </b>
        <input type="text" size="1" onChange={(event) => { modalEntry[props.index][1]= event.target.value }} defaultValue={modalEntry[props.index][1]} />
        <input type="text"disabled defaultValue="  🠆" size="1"/>
          <input type="text" onChange={(event) => { modalEntry[props.index][2] = event.target.value }} defaultValue={modalEntry[props.index][2]} size="1" />
</Col>

        </Row> 
    )
}
  const image_click_handler = (event) => {
    let new_array = modalEntry;
    new_array.push(["","",""]);
    setModalEntries([...new_array]);
 
}

  return (
    <div id="non-header-div">
      <Modal
        size="sm"
        backdrop="static"
        show={show.display}
        onHide={() => {
          setShow({ display: false, user_in: "_" });
        }}
      >
        <Modal.Header>
          <Modal.Title>编辑转移</Modal.Title>
          <Col md={{ offset: 2 }}>
            {" "}
            <input
              onClick={(event) => image_click_handler(event)}
              type="image"
              id="add_button"
              src={add_perfect}
              width="33"
              height="33"
            />
          </Col>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col md={{ offset: 1, span: 3 }}>{"读取"}</Col>
            <Col md={{ offset: 0, span: 3 }}> {"弹出"}</Col>
            <Col md={{ offset: 1, span: 3}}> {"入栈"}</Col>
            <Col md={{ offet: 1 }}></Col>
          </Row>
          {modalEntry ? (
            modalEntry.map((ar, key) => (
              <StackModalEntry
                key={key}
                read={ar[0]}
                pop={ar[1]}
                push={ar[2]}
                index={key}
              />
            ))
          ) : (
            <></>
          )}
        </Modal.Body>
        <Modal.Footer>
          {warning.on ? (
            <Badge size="sm" variant="danger">
              {warning.message}
            </Badge>
          ) : (
            <React.Fragment />
          )}

          <Button
            variant="primary"
            onClick={() => ChangeEdgeText(inputVal, show.edgeId)}
          >
            保存更改
          </Button>
        </Modal.Footer>
      </Modal>
      <div class="div-inline-group-below-header" id="bar_layout">

        <ButtonGroup id="group-holder" className="mr-2">
           <Button class="visual-button" variant="info" onClick={setInitial}>
            {" "}
            <font color="white">设置起始状态</font>
          </Button>
          <Button class="visual-button" variant="info" onClick={setAccepting}>
            {" "}
            <font color="white">设置接受状态 </font>
          </Button>
        </ButtonGroup>
        <img
          id="bar"
          ref={img_status}
          src={img_array[img_index]}
          height="34"
          width="34"
        ></img>
      </div>

      <div
        style={{ height: `${height.toString()}px` }}
        id="graph-display"
        className="Visual"
        ref={wrapper}
      ></div>
    </div>
  );
}


export default PDA_Visual;

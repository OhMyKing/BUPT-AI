import React, {useContext, useEffect, useRef, useState} from "react";
import {Badge, Button, Col, Form, InputGroup, Nav, Navbar,} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import Popup from "reactjs-popup";
import "./Run.css";
import error_image from "./error.svg";
import success_image from "./success.svg";
import {AutomataContext} from "./AutomataContext.js";
import RowInput from "./RowInput.js";
import idle_svg from "./button.svg";
import add_perfect from "./plus.svg";
import {v4 as uuidv4} from "uuid";
import { params } from './Regex';

let readImportTxt = null;
let error_object = {
  multiple_initial_states: false,
  no_label_transition: false,
  no_initial_state: false,
  epsilon_on_DFA: false,
  no_label_on_dfa: false,
  out_of_bounds: false,
};
let testID;
function Run(props) {
  const master_context = useContext(AutomataContext);
  let user_input_row_collection = [];
  const [UIN_input, set_UIN_input] = useState(false);
  let image_collection = [error_image, idle_svg, success_image];
  const [warning_display] = useState(false);
  const [row_entry_array, set_row_entries] = useState([1]);
  const test_button = useRef(null);
  const exam_button = useRef(null);
  const test_status_ref = useRef(null);
  const exam_status_ref = useRef(null);
  const row_ref_container = useRef(null);
  const exam_data = params.exam_data
  let packet_to_misha_the_microsoft_engineer = {
    PDA: false,
    alphabet: [],
    start_state: "",
    states: {},
    transition_function: [],
    determinism:
      master_context.mode == "Determinstic Finite Automata" ? true : false,
    input_strings: ["a"],
  };

  useEffect(() => {
    document
      .addEventListener("change", (event) => {
      });
  });
  let input_val = "default";
  let toBePushed = [];
  const edgeProcess = (edgeObj, nodeObj) => {
    let transition_triple = [];
    packet_to_misha_the_microsoft_engineer.determinism =
      master_context.mode == "Deterministic Finite Automata" ? true : false;
    packet_to_misha_the_microsoft_engineer.transition_function = [];
    let stack_alpha = new Set();
    let alpha = new Set();

    if (master_context.PDA) {
      packet_to_misha_the_microsoft_engineer.PDA = true;

      edgeObj.forEach((edgeObj) => {
        transition_triple = [];
        if (edgeObj.label == undefined) {
        }
        let label_to_add =
          edgeObj.label == undefined || edgeObj.label == " "
            ? "null"
            : edgeObj.label.trim();
        let from, to, label;
        from = edgeObj.from;
        to = edgeObj.to;
        if (
          edgeObj.label == undefined &&
          packet_to_misha_the_microsoft_engineer.determinism
        ) {
          error_object.no_label_on_dfa = true;
        }
        if (edgeObj.label == undefined) return;
        label = edgeObj.label.trim();
        if (from == to) {
          let sub_string_collection = label.replace(/\s/g, "").split("|");

          for (let i = 0; i < sub_string_collection.length; i++) {
            let from_label, to_label;
            transition_triple = [];
            nodeObj.forEach((nodeObj) => {
              if (nodeObj.id == from) {
                from_label = nodeObj.label;
              }
              if (nodeObj.id == to) {
                to_label = nodeObj.label;
              }
            });
            transition_triple.push(from_label.trim());
            let transition_alpha_no_whitespace = sub_string_collection[
              i
            ].replace(/\s/g, "");
            let read, push, pop;
            try {
              read = transition_alpha_no_whitespace[0];
              push = transition_alpha_no_whitespace[2];
              pop = transition_alpha_no_whitespace[5];
            } catch (e) {
              error_object.out_of_bounds = true;
              return;
            }

            transition_triple.push(read);
            alpha.add(read);
            transition_triple.push(push);
            stack_alpha.add(push);
            transition_triple.push(pop);
            stack_alpha.add(push);

            if (transition_triple[1] == "ϵ") {
              transition_triple[1] = null;
            }
            transition_triple.push(to_label.trim());

            if (
              packet_to_misha_the_microsoft_engineer.determinism &&
              transition_triple[1] == "ϵ"
            ) {
              error_object.epsilon_on_DFA = true;
            }
            packet_to_misha_the_microsoft_engineer.transition_function.push(
              transition_triple
            );
          }
        } else {
          let from_label, to_label;
          if (edgeObj.label.includes("|")) {
            let sub_string_collection = edgeObj.label.split("|");
            transition_triple = [];
            nodeObj.forEach((nodeObj) => {
              if (nodeObj.id == from) {
                from_label = nodeObj.label.trim();
              }
              if (nodeObj.id == to) {
                to_label = nodeObj.label.trim();
              }
            });
            sub_string_collection.forEach((transition_alpha) => {
              transition_triple = [];
              transition_triple.push(from_label);
              let transition_alpha_no_whitespace = transition_alpha.replace(
                /\s/g,
                ""
              );
              let read, push, pop;
              try {
                read = transition_alpha_no_whitespace[0];
                push = transition_alpha_no_whitespace[2];
                pop = transition_alpha_no_whitespace[5];
              } catch (e) {
                error_object.out_of_bounds = true;
                return;
              }

              transition_triple.push(read);
              alpha.add(read);
              transition_triple.push(push);
              stack_alpha.add(push);

              transition_triple.push(pop);
              stack_alpha.add(push);

              if (
                transition_triple[1] == "ϵ" &&
                master_context.mode == "Non-Deterministic Finite Automata"
              ) {
                transition_triple[1] = null;
              }
              transition_triple.push(to_label);
              packet_to_misha_the_microsoft_engineer.transition_function.push(
                transition_triple
              );
            });
          } else {
            nodeObj.forEach((nodeObj) => {
              if (nodeObj.id == from) {
                from_label = nodeObj.label.trim();
              }
              if (nodeObj.id == to) {
                to_label = nodeObj.label.trim();
              }
            });
            transition_triple = [];
            transition_triple.push(from_label);
            if (
              transition_triple[1] == "ϵ" &&
              master_context.mode == "Non-Deterministic Finite Automata"
            ) {
              transition_triple[1] = null;
            }
            let transition_alpha_no_whitespace = label
              .replace(/\s/g, "")
              .split("");

            let read, push, pop;
            try {
              read = transition_alpha_no_whitespace[0];
              push = transition_alpha_no_whitespace[2];
              pop = transition_alpha_no_whitespace[5];
            } catch (e) {
              error_object.out_of_bounds = true;
              return;
            }
            transition_triple.push(read);
            alpha.add(read);
            transition_triple.push(push);
            stack_alpha.add(push);

            transition_triple.push(pop);
            stack_alpha.add(pop);

            transition_triple.push(to_label);
            toBePushed.push(label_to_add.toString(10));
            packet_to_misha_the_microsoft_engineer.transition_function.push(
              transition_triple
            );
          }
        }
      });
      let alphabet_processed = [];
      [...new Set(toBePushed)].forEach((entry, id) => {
        entry.split("|").forEach((char) => {
          alphabet_processed.push(char);
        });
      });
      console.log(alpha);
      packet_to_misha_the_microsoft_engineer.transition_alphabet = [...alpha];
      packet_to_misha_the_microsoft_engineer.stack_alphabet = [...stack_alpha];
    }

    else {
      packet_to_misha_the_microsoft_engineer.PDA = false;
      edgeObj.forEach((edgeObj) => {
        transition_triple = [];
        let label_to_add =
          edgeObj.label == undefined || edgeObj.label == " "
            ? "null"
            : edgeObj.label.trim();
        let from, to, label;
        from = edgeObj.from;
        to = edgeObj.to;
        if (
          edgeObj.label == undefined &&
          packet_to_misha_the_microsoft_engineer.determinism
        ) {
          error_object.no_label_on_dfa = true;
          return;
        }
        if (edgeObj.label == undefined) return;
        label = edgeObj.label.trim();
        //  if self transition
        if (label.length > 1 && from == to) {
          let sub_string_collection = label.split(",");

          for (let i = 0; i < sub_string_collection.length; i++) {
            let from_label, to_label;
            transition_triple = [];
            nodeObj.forEach((nodeObj) => {
              if (nodeObj.id == from) {
                from_label = nodeObj.label;
              }
              if (nodeObj.id == to) {
                to_label = nodeObj.label;
              }
            });
            toBePushed.push(sub_string_collection[i]);
            transition_triple.push(from_label.trim());
            transition_triple.push(sub_string_collection[i].toString(10));
            if (transition_triple[1] == "ϵ") {
              transition_triple[1] = null;
            }
            transition_triple.push(to_label.trim());

            if (
              packet_to_misha_the_microsoft_engineer.determinism &&
              transition_triple[1] == "ϵ"
            ) {
              error_object.epsilon_on_DFA = true;
            }
            packet_to_misha_the_microsoft_engineer.transition_function.push(
              transition_triple
            );
          }
        } else {
          let from_label, to_label;
          if (edgeObj.label.includes(",")) {
            let sub_string_collection = edgeObj.label.split(",");
            transition_triple = [];
            nodeObj.forEach((nodeObj) => {
              if (nodeObj.id == from) {
                from_label = nodeObj.label.trim();
              }
              if (nodeObj.id == to) {
                to_label = nodeObj.label.trim();
              }
            });
            sub_string_collection.forEach((transition_alpha) => {
              transition_triple = [];
              toBePushed.push(transition_alpha);
              transition_triple.push(from_label);
              transition_triple.push(transition_alpha);
              if (
                transition_triple[1] == "ϵ" &&
                master_context.mode == "Non-Deterministic Finite Automata"
              ) {
                transition_triple[1] = null;
              }
              transition_triple.push(to_label);
              packet_to_misha_the_microsoft_engineer.transition_function.push(
                transition_triple
              );
            });
          } else {
            nodeObj.forEach((nodeObj) => {
              if (nodeObj.id == from) {
                from_label = nodeObj.label.trim();
              }
              if (nodeObj.id == to) {
                to_label = nodeObj.label.trim();
              }
            });
            transition_triple = [];
            transition_triple.push(from_label);
            if (
              transition_triple[1] == "ϵ" &&
              master_context.mode == "Non-Deterministic Finite Automata"
            ) {
              transition_triple[1] = null;
            }
            transition_triple.push(label);
            transition_triple.push(to_label);

            toBePushed.push(label_to_add.toString(10));
            packet_to_misha_the_microsoft_engineer.transition_function.push(
              transition_triple
            );
          }
        }
      });
      let alphabet_processed = [];

      [...new Set(toBePushed)].forEach((entry, id) => {
        entry.split(",").forEach((char) => {
          alphabet_processed.push(char);
        });
      });
      packet_to_misha_the_microsoft_engineer.alphabet = alphabet_processed;
    }
  };
  const nodeProcess = (nodeObj) => {
    let start_state = "";
    let accepting_states = [];
    let states = [];
    let multiple_initial_states_check = false;
    let sState = "";
    nodeObj.forEach((node) => {
      if (!states.includes(node.label)) {
        states.push("" + node.label.trim());
      }
      if (node.init) {
        if (multiple_initial_states_check) {
          error_object.multiple_initial_states = true;
          return;
        }
        sState = node.label.trim();
        multiple_initial_states_check = true;
      }
      if (node.shape == "triangle") {
        start_state = node.label.trim();
      }
      if (node.borderWidth == 3) {
        if (!accepting_states.includes(node.label)) {
          accepting_states.push(node.label.trim());
        }
      }
    });

    if (multiple_initial_states_check == false) {
      error_object.no_initial_state = true;
      // return;
    }
    packet_to_misha_the_microsoft_engineer.start_state = sState;
    states.forEach((label) => {
      let isAccepting = false;
      if (accepting_states.includes(label)) {
        isAccepting = true;
      }
      packet_to_misha_the_microsoft_engineer.states["" + label] = isAccepting;
    });
  };
  const preprocess = () => {
    edgeProcess(
      master_context.graphObj.edges.get(),
      master_context.graphObj.nodes.get()
    );
    nodeProcess(master_context.graphObj.nodes.get());
  };
  const animateIntoNeutral = (status_ref, test_button_ref) => {
    status_ref.current.classList.remove("spinner-border");
    status_ref.current.classList.remove("spinner-border-sm");
  };
  async function postToRustApi(status_ref, test_button_ref) {
    let endpoint = master_context.PDA ? "pda" : "automata";
    let url = "https://rflap.acmuic.app/" + endpoint;

    if (packet_to_misha_the_microsoft_engineer.PDA) {
      delete packet_to_misha_the_microsoft_engineer.state_names;
      delete packet_to_misha_the_microsoft_engineer.determinism;
      delete packet_to_misha_the_microsoft_engineer.alphabet;
      delete packet_to_misha_the_microsoft_engineer.PDA;
      packet_to_misha_the_microsoft_engineer.transition_function.forEach(
        (ar_, id) => {
          ar_.forEach((item, index) => {
            if (item == "ϵ") {
              ar_[index] = "!";
            }
          });
        }
      );
      packet_to_misha_the_microsoft_engineer.stack_alphabet.map(
        (item, index) => {
          if (item == "ϵ") {
            packet_to_misha_the_microsoft_engineer.stack_alphabet[index] = "!";
          }
        }
      );
      packet_to_misha_the_microsoft_engineer.transition_alphabet.map(
        (item, index) => {
          if (item == "ϵ") {
            packet_to_misha_the_microsoft_engineer.transition_alphabet[index] =
              "!";
          }
        }
      );
    }

    let postingObject = {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(packet_to_misha_the_microsoft_engineer),
    };
    const pad = (n, width, z) => {
      z = z || "0";
      n = n + "";
      return n.length >= width
        ? n
        : new Array(width - n.length + 1).join(z) + n;
    };
    const toMins = (seconds) =>
      Math.floor(seconds / 60).toString() +
      ":" +
      pad(Math.round(seconds % 60), 2).toString();
    testID = uuidv4();
    if (error_object.multiple_initial_states) {
      alert("\tMultiple Initial States!");
      //reset object for next API request
      error_object = {
        no_label_transition: false,
        multiple_initial_states: false,
        no_initial_state: false,
      };

      return null;
    }
    if (error_object.no_initial_state) {
      alert("请设置初始状态");
      error_object = {
        multiple_initial_states: false,
        no_label_transition: false,
        no_initial_state: false,
        epsilon_on_DFA: false,
        no_label_on_dfa: false,
      };
      animateIntoNeutral(status_ref, test_button_ref);
      return null;
    }
    let Algorithms_are_the_computational_content_of_proofs;
    try {
      Algorithms_are_the_computational_content_of_proofs = await fetch(
        url,
        postingObject
      );
    } catch (e) {}

    error_object = {
      multiple_initial_states: false,
      no_label_transition: false,
      no_initial_state: false,
      epsilon_on_DFA: false,
    };
    return await Algorithms_are_the_computational_content_of_proofs.json();
  }
  async function onClickPingToApi(status_ref, test_button_ref, intention = 'test') {
    if (intention === 'test'){
      packet_to_misha_the_microsoft_engineer.input_strings = [];
      console.log(user_input_row_collection)
      user_input_row_collection.forEach((_, id) => {
        packet_to_misha_the_microsoft_engineer.input_strings.push(_);
      });
    }else {
      packet_to_misha_the_microsoft_engineer.input_strings = [];
      exam_data.forEach((_, id) => {
        packet_to_misha_the_microsoft_engineer.input_strings.push(_);
      });
    }
    preprocess();

    try {
      let callback;
      try {
        callback = await postToRustApi(status_ref, test_button_ref);
        animateIntoNeutral(status_ref, test_button_ref);
      } catch (err) {
        console.log("10");
      }
      if (callback == null) {
        return;
      }
      const pad = (n, width, z) => {
        z = z || "0";
        n = n + "";
        return n.length >= width
          ? n
          : new Array(width - n.length + 1).join(z) + n;
      };
      const toMins = (seconds) =>
        Math.floor(seconds / 60).toString() +
        ":" +
        pad(Math.round(seconds % 60), 2).toString();
      const getMinsIntoSession = (sessionStart, sessionPing) =>
        toMins((sessionPing - sessionStart) / 1000);

      const createTestCallbackPost = (
        testID,
        testStringsResultArray,
        callbackHint
      ) => {
        return {
          sessionID: master_context.session,
          testID: testID,
          callbackTime: getMinsIntoSession(master_context.date, new Date()),
          callbackPacket: JSON.stringify(callback),
          callbackHint: callbackHint,
          testStringsCorrect: JSON.stringify(testStringsResultArray),
          numCorrect: testStringsResultArray.reduce(
            (sum, bool) => sum + (bool ? 1 : 0),
            0
          ),
        };
      };
      let dotnetTestCallbackPost = {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: "",
      };
      if (
        (callback["hint"] != "" || !callback.list_of_strings[0][0]) &&
        master_context.mode === "Deterministic Finite Automata"
      ) {
        alert("Invalid determinism!\n" + callback["hint"]);
        let mounting_array = [];
        for (let i = 0; i < row_entry_array.length; i++) {
          mounting_array.push(1);
        }
        set_row_entries([...mounting_array]);
      } else {
        let new_array;
        if(intention === 'test'){
          if (row_entry_array.length == 1) {
            let bool_result = master_context.PDA
                ? callback.list_of_strings[0][0]
                : callback.list_of_strings[0][1];

            bool_result ? (new_array = [2]) : (new_array = [0]);
            set_row_entries([...new_array]);
            dotnetTestCallbackPost.body = JSON.stringify(
                createTestCallbackPost(testID, [bool_result], "")
            );
          } else {
            let array_to_mount = [];
            for (let i = 0; i < row_entry_array.length; i++) {
              let bool_result = master_context.PDA
                  ? callback.list_of_strings[i][0]
                  : callback.list_of_strings[i][1];
              if (bool_result) {
                array_to_mount.push(2);
              } else {
                array_to_mount.push(0);
              }
            }
            set_row_entries([...array_to_mount]);
            dotnetTestCallbackPost.body = JSON.stringify(
                createTestCallbackPost(
                    testID,
                    array_to_mount.map((n) => (n > 0 ? true : false)),
                    ""
                )
            );
          }
        }
        else{
          let columnIndex = master_context.PDA ? 0 : 1;
          let result = callback.list_of_strings.every(row => row[columnIndex] === true);
          // console.log("status:", callback.list_of_strings);
          console.log("result:", result);
          if(result){
            window.top.postMessage(result, '*');
          }
          let boolResultsArray = new Array(row_entry_array.length).fill(false);
          set_row_entries(new Array(row_entry_array.length).fill(1));
          dotnetTestCallbackPost.body = JSON.stringify(
              createTestCallbackPost(testID, boolResultsArray, "")
          );
        }
      }
    } catch (e) {}
  }
  const HTMLCol_to_array = (html_collection) =>
    Array.prototype.slice.call(html_collection);

  const process_userinput = (row_table_DOM_node, id) => {
    user_input_row_collection[id] = HTMLCol_to_array(
      row_table_DOM_node.children
    )[0].value;
  };

  function on_click_test_api(event, status_ref, test_button_ref, intention='test') {
    const animateIntoTesting = (status_ref, test_button_ref) => {
      status_ref.current.classList.add("spinner-border");
      status_ref.current.classList.add("spinner-border-sm");
    };
    animateIntoTesting(status_ref, test_button_ref);

    user_input_row_collection = [
      ...Array(HTMLCol_to_array(row_ref_container.current.children).length),
    ];
    event.preventDefault();
    HTMLCol_to_array(row_ref_container.current.children).map(process_userinput);
    onClickPingToApi(status_ref, test_button_ref, intention);
  }
  function image_click_handler(event) {
    let new_array = row_entry_array;
    new_array.push(1);
    set_row_entries([...new_array]);
  }
  const WarningSign = () => {
    return <Badge variant="danger"> Enter: name@uic.edu</Badge>;
  };
  function set_text_form(event) {
    input_val = event.target.value;
  }
  return (
    <div id="inside-div-scrollbar">
      <Navbar className="bg-dark justify-content-between" id="nav-header">
        <Button
            id="exam_button"
            variant="info"
            onClick={(event) =>
                on_click_test_api(event, exam_status_ref, exam_button, 'exam')
            }
            ref={exam_button}
        >
          <span role="status" aria-hidden="true" ref={exam_status_ref}></span>
          {" 镌刻 "}
        </Button>
        <Nav>
          <Col
            className="justify-content-between"
            id="add_row_button_container"
          >
            <input
              id="add_row_button"
              onClick={(event) => image_click_handler(event)}
              type="image"
              id="add_button"
              src={add_perfect}
              width="33"
              height="33"
              name="add_row_input"
            />
          </Col>
          {(
              <Button
                  id="api_button"
                  variant="info"
                  onClick={(event) =>
                      on_click_test_api(event, test_status_ref, test_button)
                  }
                  ref={test_button}
              >
                <span role="status" aria-hidden="true" ref={test_status_ref}></span>
                {" 测试 "}
              </Button>
          )}
        </Nav>



      </Navbar>
      <div className="mt-3" ref={row_ref_container}>
        {row_entry_array ? (
          row_entry_array.map((_, key) => (
            <RowInput
              key={key}
              image={image_collection[row_entry_array[key]]}
            />
          ))
        ) : (
          <></>
        )}
      </div>
      <Popup
        open={UIN_input}
        onClose={() => {
          set_UIN_input(false);
        }}
      >

        <div>
          {warning_display ? (
            <WarningSign />
          ) : (
            <React.Fragment></React.Fragment>
          )}

          <InputGroup className="mb-2b">
            <Form.Control
              type="text"
              onChange={(text) => {
                set_text_form(text);
              }}
            />
            <InputGroup.Append>
            </InputGroup.Append>
          </InputGroup>
        </div>
      </Popup>
    </div>
  );
}
export default Run;

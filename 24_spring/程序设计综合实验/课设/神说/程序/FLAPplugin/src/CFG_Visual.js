import React, {useContext, useEffect, useRef, useState} from "react";
import {AutomataContext} from "./AutomataContext.js";
import {Badge, Button, Col, Form, InputGroup, Row} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import Rule from "./Rule.js";
import "./CFG_Visual.css";
import RowInput from "./RowInput.js";
import error_image from "./error.svg";
import success_image from "./success.svg";
import idle_svg from "./button.svg";
import add_perfect from "./plus.svg";
import g from "cfgrammar-tool"
import Popup from "reactjs-popup";
import {params} from './Regex';

let CFG_Visual_Context_Index = -1;
let bool_first_mount = false;
let readImportTxt;
let inputValForExport;

let types = g.types;
    let parser = g.parser;
let Grammar = types.Grammar;
    let Rule_Dec= types.Rule;
    
    let T = types.T;
    let NT = types.NT;
  

function CFG_Visual() {
  const formArea = useRef(null);
  const master_context = useContext(AutomataContext);
  let grammar_table_text = []; // where each index is a line in the grammar table definition
  let image_collection = [error_image, idle_svg, success_image];
  const [row_entry_array, set_row_entries] = useState([1]);
  const [definition_entry_array, set_definition_entry_array] = useState([]);
  const [displayWarning, setDisplayWarning] = useState(false)
  React.useState()[1].bind(null, {});
  const [exportModal, setExportModal] = useState(false)
  const toMins = (seconds) =>
  Math.floor(seconds / 60).toString() +
  ":" +
  pad(Math.round(seconds % 60), 2).toString();

  const pad = (n, width, z) => {
    z = z || "0";
    n = n + "";
    return n.length >= width
      ? n
      : new Array(width - n.length + 1).join(z) + n;
  };
  const row_ref_container = useRef(null);
  let input_val = "";
  let user_input_row_collection = [];
  let exam_data =  params.exam_data;
  let packet_to_misha_the_fasting_juggernaut = {
    term: [],
    non_term:[],
    productions:{
    },
    user_input: []
  }; // packet sent to API
  const WarningSign = () => {
    return <Badge variant="danger">Enter: name@uic.edu</Badge>;
  };
  const definition_plus_handler = button_press => {
    let array_to_mount = definition_entry_array;
    CFG_Visual_Context_Index += 1;
    let grammar_table_line = {
      TERM: " ",
      NON_TERM: " ",
      index: CFG_Visual_Context_Index
    };
    (!bool_first_mount) ? bool_first_mount = true: bool_first_mount = bool_first_mount;
    bool_first_mount = true;
    
    array_to_mount.push(grammar_table_line);
    set_definition_entry_array([...array_to_mount]);
    master_context.grammar_obj = definition_entry_array;
  };
  const tests_plus_handler = button_press => {
    let new_array = row_entry_array;
    new_array.push(1);
    set_row_entries([...new_array]);
  };
  useEffect(() => {

    document.addEventListener("input", e => {
      if(e.target.id == "rule_terminal" || e.target.id == "rule_non-terminal"){
      let rule_to_table = "";
      let textarea_text = "";
      grammar_table_text = [];
      master_context.grammar_obj.forEach((rule_object, index) => {
        rule_to_table = "";
        rule_to_table += rule_object.NON_TERM;
        rule_to_table += " \u21d2";
        let accumulating_string = "";
        if (rule_object.TERM !== " ") {
          let l = rule_object.TERM.split("|").length;
          rule_object.TERM.split("|").forEach((str, index) => {
            if (l - 1 === index || l === 1) {
              accumulating_string += " " + str + " ";
            } else {
              accumulating_string += " " + str + " |";
            }
          });
        }

        rule_to_table += accumulating_string;

        grammar_table_text.push(rule_to_table);
      });
      grammar_table_text.forEach((string_text, index) => {
        textarea_text += string_text + "\n\n";
        textarea_text = textarea_text.replace(/!/g, "\u03B5");

      });
      if(formArea != null && formArea.current != null)
      formArea.current.value = textarea_text;
    }
    });
  }, []);

  const HTMLCol_to_array = html_collection => Array.prototype.slice.call(html_collection);
  const process_userinput = (row_table_DOM_node, id) => {
    user_input_row_collection[id] = HTMLCol_to_array(
      row_table_DOM_node.children
    )[0].value;
  };

  const preprocessor = ()=>{
      let error_found = false;
      let packet;
      let alphabet = {
        terminals: new Set(),
        non_terminals: new Set(),
      };
      packet = {
        term: [],
        non_term:[],
        productions:{
        },
        user_input: []
      };
      master_context.grammar_obj.forEach( (rule_obj,id) => {
        rule_obj.NON_TERM = rule_obj.NON_TERM.trim();
        if(rule_obj.NON_TERM.length > 1){
          alert("Rule with non-terminal that has more than one character!")
          error_found = true;
          return;
        }
        if(rule_obj.NON_TERM != rule_obj.NON_TERM.toUpperCase()){
          alert("terminal (lower-case letter or numeric) in left-hand non-terminal position!")
          error_found = true;
          return;
        }
        if(rule_obj.TERM.trim().length == 0){
          alert("Rule with empty body!");
          error_found = true;
          return;
        }
        
        let NON_TERM = rule_obj.NON_TERM;
        alphabet.non_terminals.add(NON_TERM);
        if(packet.productions[NON_TERM] == undefined || packet.productions[NON_TERM] == null) packet.productions[NON_TERM] = [];
        let arr_of_arr_of_chars = [];
        rule_obj.TERM.split("|").forEach((string,index)=>{
          arr_of_arr_of_chars.push(Array.from(string.trim()));
          alphabet.terminals.add(string);
        });
        packet.productions[NON_TERM] = packet.productions[NON_TERM].concat(arr_of_arr_of_chars);
        
      } );

      packet.term = [...alphabet.terminals];
      packet.non_term = [...alphabet.non_terminals];
      return packet;
  }

    function  on_click_CFG_api(e,intention='test') {
      e.preventDefault();

      let object_description = preprocessor();
      let array_of_rules = [];
      const is_numeric = (str)=>{
        return /^\d+$/.test(str);
      }
      object_description.non_term.forEach( (NON_TERM_CHAR)=>{
        let non_term_for_lib;
        object_description.productions[NON_TERM_CHAR].forEach((rule_atom)=>{
          non_term_for_lib = NON_TERM_CHAR;
          let production_for_lib = [];
          
          rule_atom.forEach((char)=>{

            if(char == "!"){
              // console.log("E" +  "\u025B");
              production_for_lib.push();
            }
            else if(is_numeric(char)){
              production_for_lib.push(T(char));
            }
            else if(char == char.toUpperCase()){
              // console.log("up" + char);
              production_for_lib.push(NT(char));
            }
            
            else{
              // console.log("down" + char);

              production_for_lib.push(T(char));
            }
          })
         array_of_rules.push(Rule_Dec(NON_TERM_CHAR,production_for_lib));
        });
      });
      let grammar_with_funcs;
      if(array_of_rules == null || array_of_rules == undefined || array_of_rules.length == 0){
        alert("Make rules in the left definition table!");
        return;
      }
      else{
       grammar_with_funcs = Grammar(
        array_of_rules
      )
      }
      user_input_row_collection = [
        ...Array(HTMLCol_to_array(row_ref_container.current.children).length)
      ];
      HTMLCol_to_array(row_ref_container.current.children).map(process_userinput);
      let input_strings_CFG = [];
      let bool_results = [];
      if(intention === 'test'){
        user_input_row_collection.forEach((_, id) => {
          input_strings_CFG.push(_);
        });
        input_strings_CFG.forEach(  (test_string)=>{
          bool_results.push( (parser.parse(grammar_with_funcs, test_string).length > 0) ? 2 : 0 ); // true
        })
      }else{
        user_input_row_collection.forEach((_, id) => {
          input_strings_CFG.push(_);
        });
        exam_data.forEach(  (test_string)=>{
          bool_results.push( (parser.parse(grammar_with_funcs, test_string).length > 0) ? 2 : 0 ); // true
        })
        const result = bool_results.every(value => value === 2);
        console.log("result:", result); // 打印最终结果
        if(result){
          window.top.postMessage(result, '*');
        }
        bool_results.fill(1);
      }
      set_row_entries([...bool_results]);
    }
  return (
    <div id="row_container_CFG">
      <Row>
        <Form as={Col} md={{ span: 4 }}>
          <Row  class="row-input-div">
            <Col md={{ span: 1, offset: 5 }}>
              <h4>输入</h4>
            </Col>
            <Col md={{ offset: 0 }}>
              <input
                id="add_row_button"
                onClick={(event) => definition_plus_handler(event)}
                type="image"
                id="add_button"
                src={add_perfect}
                wifdth="23"
                height="23"
                name="add_row_input"
              />
            </Col>
          </Row>
          <div id="definition-holder">          {definition_entry_array ? (
            definition_entry_array.map((payload, key) => (
              <Rule term={payload.TERM} non_term={payload.NON_TERM} index={key} key={Math.random()} />
            ))
          ) : (
            <></>
          )}
</div>

        </Form>
        <Col md={{ span: 3 }}>
          <h5>文法</h5>
          <Form.Control
            id="grammar_text"
            type="text"
            as="textarea"
            disabled
            ref={formArea}
            rows="20"
          ></Form.Control>
        </Col>
        <Col md={{ offset: 0, span: 5 }}>
          <Row>
            <Col md={{ span: 3 }}>
              <Button
                id="api_button_CFG"
                onClick={(event) => on_click_CFG_api(event)}
                variant="info"
                size="sm"
              >
                测试
              </Button>
            </Col>
            <Col md={{ offset: 1, span: 2 }}>
                <h4>测试</h4>
           </Col>
            <Col md={{offset:0, span:1}}>
              <input
              id="add_row_button_CFG_tests"
              onClick={(event) => tests_plus_handler(event)}
              type="image"
              id="add_button"
              src={add_perfect}
              width="22"
              height="22"
              name="add_row_input"
            />
              </Col>

            <Col>
              <Button
                  id="exam_button_CFG"
                  onClick={(event) => on_click_CFG_api(event, 'exam')}
                  variant="info"
                  size="sm"
              >
                镌刻
              </Button>
            </Col>
          </Row>
          <div ref={row_ref_container}>
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
        </Col>
      </Row>

      <Popup
        open={exportModal}
        onClose={() => {
          setExportModal(false);
        }}
      >
        <div>
          {displayWarning ? (
            <WarningSign message="Enter: name@uic.edu" />
          ) : (
            <React.Fragment></React.Fragment>
          )}
          <InputGroup className="mb-2b">
            <Form.Control
              type="text"
              onChange={(text) => {
                inputValForExport = text.target.value;
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

export default CFG_Visual;

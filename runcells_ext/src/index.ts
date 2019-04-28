import {
  IDisposable, DisposableDelegate
} from '@phosphor/disposable';

import {
  JupyterLab, JupyterLabPlugin
} from '@jupyterlab/application';

import {
  ToolbarButton
} from '@jupyterlab/apputils';

import {
  Widget
} from '@phosphor/widgets';

import {
  DocumentRegistry
} from '@jupyterlab/docregistry';

import {
  NotebookActions, NotebookPanel, INotebookModel
} from '@jupyterlab/notebook';

import '../style/index.css';

/**
 * The plugin registration information.
 */
const plugin: JupyterLabPlugin<void> = {
  activate,
  id: 'runcells_ext',
  autoStart: true
};

/**
 * A notebook widget extension that adds a button to the toolbar.
 */
export
class ExperimentExtension implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {
  /**
   * Create a new extension object.
   */
  createNew(panel: NotebookPanel, context: DocumentRegistry.IContext<INotebookModel>): IDisposable {
    let prefix = panel.content.title.label
    //*************************************************************************//
    let callback = () => {
      // **** actually run the experiment
      //get the raw string from the input
      let label = (document.getElementById(prefix+'exp_select') as HTMLButtonElement).innerText;
      let tab_cell = document.getElementById(prefix+label+"_exp_string") as HTMLTableDataCellElement;
      if (tab_cell){
        var raw_str = tab_cell.innerText;
        console.log(raw_str);
        var exp_array = raw_str.split('-');   
        exp_array.forEach(cell_str => {
          var cell_id = Number(cell_str);
          if (!isNaN(cell_id)){  
            panel.content.activeCellIndex = cell_id; 
            NotebookActions.run(panel.content, context.session);
            panel.content.deselectAll();
          }
        });
        console.log('Experiments run!');
      } else{
        console.log('No experiment set!');
      }
    };
    panel.context.ready.then(() => {
      //*************************************************************************//
      // create and populate the (initially) hidden dropdown div
      //create and fill the content of the dropdown div
      let dropdown_div = document.createElement('div') as HTMLDivElement;
      dropdown_div.id = prefix+"exp_dropdown";
      dropdown_div.setAttribute("class", "dropdown-content");    
      //create the drop down table
      let dd_tab = document.createElement('table') as HTMLTableElement;
      dd_tab.id = prefix+"drop_down_table";
      // get the saved experiments from the notebook metadata
      if (!panel.model.metadata.has("EXP_DICT")){
        console.log("overwriting...")
        panel.model.metadata.set("EXP_DICT", {});
      }
      let EXP_DICT : any = panel.model.metadata.get("EXP_DICT")
      
      console.log(EXP_DICT);

      function creatExperimentRow(label:string, exp_string:string){
        let row = document.createElement('tr') as HTMLTableRowElement;
        row.id = prefix+label;
        // create cell for label button
        let td1 = document.createElement('td') as HTMLTableDataCellElement;
        let label_button = document.createElement("button") as HTMLButtonElement;
        label_button.innerText = label;
        function setExperiment(){
          let btn = document.getElementById(prefix+"exp_select");
          btn.innerText = label_button.innerText;
          btn.setAttribute("value", td2.innerText);
        }
        label_button.onclick = setExperiment;
        td1.appendChild(label_button);
        // create cell for exp_string
        let td2 = document.createElement('td') as HTMLTableDataCellElement;
        td2.id = prefix+label+"_exp_string";
        td2.innerText = exp_string;
        // create remove button in third cell
        let td3 = document.createElement('td') as HTMLTableDataCellElement;
        let del_btn = document.createElement("button") as HTMLButtonElement;
        del_btn.innerText = "Remove";
        function delExperiment(){
          delete EXP_DICT[label];
          panel.model.metadata.set("EXP_DICT", EXP_DICT);
          console.log(EXP_DICT);
          let tab = document.getElementById(prefix+"drop_down_table") as HTMLTableElement;
          tab.removeChild(row);
          let btn = document.getElementById(prefix+"exp_select");
          if(btn.innerText == label_button.innerText){
            btn.innerText = "Select Experiment";
          }
        }
        del_btn.onclick = delExperiment;
        td3.appendChild(del_btn);
        // add all three cells to the row
        row.appendChild(td1);
        row.appendChild(td2);
        row.appendChild(td3);
        return row
      }
      
      for(let key in EXP_DICT){
        let value = EXP_DICT[key];
        let row = creatExperimentRow(key, value);
        dd_tab.appendChild(row);
      }
      //create the input row of the table
      let input_row = document.createElement('tr') as HTMLTableRowElement;
      //create value tag and td
      let value_text = document.createElement('input');
      value_text.placeholder = 'Label the cell path';
      value_text.id = prefix+'val_input';
      let input_value_td = document.createElement('td') as HTMLTableDataCellElement;
      input_value_td.appendChild(value_text);
      //create a input tag and td
      let input_text = document.createElement('input');    
      input_text.placeholder = "index # with '-' between each";
      input_text.id = prefix+'exp_input';
      let input_text_td = document.createElement('td') as HTMLTableDataCellElement;
      input_text_td.appendChild(input_text);
      // add a button to save the new experiment
      let add_btn = document.createElement("button");
      add_btn.innerText = "Add";
      function addExperiment(){
        let label = (document.getElementById(prefix+"val_input")as HTMLInputElement).value;
        let exp_string= (document.getElementById(prefix+"exp_input") as HTMLInputElement).value;
        EXP_DICT[label] = exp_string;
        panel.model.metadata.set("EXP_DICT", EXP_DICT);
        console.log(EXP_DICT);
        let row = document.getElementById(prefix+label);
        if(row){
          (row.children[1] as HTMLTableDataCellElement).innerText = exp_string;
        } else{
          row = creatExperimentRow(label, exp_string);
          dd_tab.insertBefore(row, dd_tab.firstChild); 
        } 
      }
      add_btn.onclick = addExperiment;
      let btn_td = document.createElement("td") as HTMLTableDataCellElement;
      btn_td.appendChild(add_btn);
      // add both to the row tag
      input_row.appendChild(input_value_td);
      input_row.appendChild(input_text_td); 
      input_row.appendChild(btn_td);   
      // add the row to the table
      dd_tab.appendChild(input_row);
      //add table to dropdown div
      dropdown_div.appendChild(dd_tab);
      // add the dropdown div to the main panel
      panel.node.appendChild(dropdown_div);    
    });
    //*************************************************************************//
    //create a new widget for the toolbar that is a button that toggles the dropdown options
    let ddm_widget = new Widget();
    let ddm_div = document.createElement('div') as HTMLDivElement;
    ddm_div.setAttribute("style", "position: relative; display: inline-block;");
    let exp_select = document.createElement("button") as HTMLButtonElement;
    function displayExp() {
      document.getElementById(prefix+"exp_dropdown").classList.toggle("show");
    }
    exp_select.onclick = displayExp;
    exp_select.innerText = "Select Experiment";
    exp_select.id = prefix+"exp_select";
    // add the button to the ddm div
    ddm_div.appendChild(exp_select);
    // add the div to the ddm widget
    ddm_widget.node.appendChild(ddm_div);       
    /****************************************************************************/
    //create a new button
    let button = new ToolbarButton({
      className: 'myButton',
      iconClassName: 'fa fa-fast-forward',
      onClick: callback,
      tooltip: 'Run Experiments'
    });
    /****************************************************************************/
    panel.toolbar.insertItem(9, 'Experiments Cells Input', ddm_widget);
    panel.toolbar.insertItem(10, 'Experiments', button);
    return new DisposableDelegate(() => {
      button.dispose();
    });
  }
}

/**
 * Activate the extension.
 */
function activate(app: JupyterLab) {
  app.docRegistry.addWidgetExtension('Notebook', new ExperimentExtension());
};

export default plugin;

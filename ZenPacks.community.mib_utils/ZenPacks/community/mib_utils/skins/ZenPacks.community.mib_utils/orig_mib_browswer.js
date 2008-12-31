window.onload = initAll;
// YAHOO.util.Event.addListener( window, "load", initAll );
// YAHOO.util.Event.onAvailable( "mib_browser", mib_browser );
var xhr = false;

/*
  Map of YAHOO.widget.TextNode instances in the TreeView instance.
 */

var oTextNodeMap= {};

/*
  The YAHOO.widget.TextNode instance whose "contextmenu"
  DOM event triggered the display of the
  ContextMenu instance.
*/
var oCurrentTextNode= null;

var oTreeView= false;

/*
 * The following are XML document links to specific portions of the oid_detail iframe
 */
var oid_name= false;
var oid_access= false;
var oid_status= false;
var oid_node_type= false;
var oid_description= false;
var oid_number= false;


/*
 * ===================================================================
 *    Function declarations
 */
function initAll() {
 var mib_info= document.getElementById("mib_id");
 mib_name= mib_info.getAttribute( "name" );
 mib_url= mib_info.getAttribute( "value" );

 if( window.XMLHttpRequest) {
     xhr= new XMLHttpRequest();

 } else {
     if( window.ActiveXObject ) {
        try {
             xhr= new ActiveXObject("Microsoft.XMLHTTP");
        }
        catch (e) { }
     }
 }

 if( xhr ) {
     xhr.onreadystatechange= process_XML_MIB_response;
     xhr.open( "GET", mib_url, true );
     xhr.send(null);

 } else {
     alert( "Sorry, but I couldn't create an XMLHttpRequest" );
 }
}



function trim( text ) {
 return( text.replace( /(^\s*|\s*$)/, "" ) );
}



// Creates a TextNode instance and appends it to the TreeView
function build_tree_from_nodes( root_node, xml_nodes ) {
 var i, oid_value, node;
 var seen_nodes= { };

 var node_list= xml_nodes.getElementsByTagName( "node" );
 for( i= 0; node_list[i] ; i++ ) {
     var node_data= {
             label: node_list[i].getAttribute( "name" ),
             // Tooltip will use the title attribute
             title: trim( node_list[i].childNodes[1].textContent ),
             style: "mib_treeview_label",
     };

     oid_value= node_list[i].getAttribute( "oid" );

     var oid_array= oid_value.split( '.' );
     oid_array.pop();
     var prev_oid= oid_array.join('.');
     if( prev_oid in seen_nodes ) { // Found an exact match
         node = new YAHOO.widget.TextNode( node_data, seen_nodes[ prev_oid ], false);
         seen_nodes[ oid_value ]= node;

     } else {
         while( oid_array.length > 0 ) { // Look for sub-matches
            oid_array.pop();
            prev_oid= oid_array.join('.');
            if( prev_oid in seen_nodes ) {
                node = new YAHOO.widget.TextNode( node_data, seen_nodes[ prev_oid ], false);
                seen_nodes[ oid_value ]= node;
                break;
            }
         }
         if( oid_array.length == 0 ) { // no match at all (possibly first entry)
             node = new YAHOO.widget.TextNode( node_data, root_node, false);
             seen_nodes[ oid_value ]= node;
         }
     }

     node.data= node_list[i];
     oTextNodeMap[ node.labelElId ] = node;
 }
}



/*
  Adds a new TextNode as a child of the TextNode instance
  that was the target of the "contextmenu" event that
  triggered the display of the ContextMenu instance.
*/
function addNode() {
 var sLabel= window.prompt( "Enter a label for the new node: ", ""), oChildNode;

 if( sLabel && sLabel.length > 0 ) {                       
    oChildNode= new YAHOO.widget.TextNode( sLabel, oCurrentTextNode, false );

    oCurrentTextNode.refresh();
    oCurrentTextNode.expand();

    oTextNodeMap[ oChildNode.labelElId ]= oChildNode;
 }
}



/*
  Edits the label of the TextNode that was the target of the
  "contextmenu" event that triggered the display of the
  ContextMenu instance.
*/
function editNodeLabel() {
 var sLabel= window.prompt( "Enter a new label for this node: ", oCurrentTextNode.getLabelEl().innerHTML );

 if( sLabel && sLabel.length > 0 ) {                       
    oCurrentTextNode.getLabelEl().innerHTML= sLabel;
 }
}



/*
  Deletes the TextNode that was the target of the "contextmenu"
  event that triggered the display of the ContextMenu instance.
*/
function deleteNode() {
 delete oTextNodeMap[ oCurrentTextNode.labelElId ];

 oTreeView.removeNode( oCurrentTextNode );
 oTreeView.draw();
}



/*
  "contextmenu" event handler for the element(s) that
  triggered the display of the ContextMenu instance - used
  to set a reference to the TextNode instance that triggered
  the display of the ContextMenu instance.
*/
function onTriggerContextMenu( p_oEvent ) {
 /*
   Returns a TextNode instance that corresponds to the DOM
   element whose "contextmenu" event triggered the display
   of the ContextMenu instance.
  */
  function getTextNodeFromEventTarget( p_oTarget ) {       
   if( p_oTarget.tagName.toUpperCase() == "A" &&
       p_oTarget.className == "ygtvlabel") {
       return oTextNodeMap[p_oTarget.id];

   } else if( p_oTarget.parentNode && p_oTarget.parentNode.nodeType == 1) {
              return getTextNodeFromEventTarget(p_oTarget.parentNode);
          }                   
   }

 /*
   Get the TextNode instance that that triggered the
   display of the ContextMenu instance.
  */
 var oTextNode = getTextNodeFromEventTarget( this.contextEventTarget );

 if( oTextNode ) {
    oCurrentTextNode = oTextNode;

 } else { // Cancel the display of the ContextMenu instance.
    this.cancel();
 }
}



function add_root( root_label, root_description, xml_doc ) {
 var root_node= false;
 var o= {
        label: root_label,
        // Tooltip will use the title attribute
        title: root_description,
        style: "mib_treeview_label",
 };
 root_node= new YAHOO.widget.TextNode(o, oTreeView.getRoot(), false);
        
 /*
   Add the TextNode instance to the map, using its
   HTML id as the key.
  */
 oTextNodeMap[ root_node.labelElId ]= root_node;                   

 build_tree_from_nodes( root_node, xml_doc );
}



function display_oid_data( node ) {
 var this_node= node.data;

 oid_name.setAttribute( 'value', node.label );
 oid_number.setAttribute( 'value', this_node.getAttribute( 'oid' ) );
 oid_access.setAttribute( 'value', this_node.getAttribute( 'access' ) );
 oid_status.setAttribute( 'value', this_node.getAttribute( 'status' ) );
 oid_node_type.setAttribute( 'value', this_node.getAttribute( 'type' ) );

 oid_description.textContent= trim( this_node.getElementsByTagName("description")[0].textContent );
}


function mib_browser( view_frame, xml_doc ) {
 // Create a TreeView instance
 oTreeView= new YAHOO.widget.TreeView( "mib_browser" );

// oTreeView= new YAHOO.widget.TreeView( view_frame );
 var n, oTextNode;
 var nodes, traps;

 nodes= xml_doc.getElementsByTagName( "nodes" )[0];
 add_root( "Nodes", "Root of the MIB", nodes );

 traps= xml_doc.getElementsByTagName( "notifications" )[0];
 add_root( "Traps", "Notifications sent from the MIB agent", traps );

 oTreeView.draw();

 var context_menu_options= {
       trigger: "mib_browser",
       lazyload: true,
       itemdata: [
                  { text: "Add Child Node", onclick: { fn: addNode } },
                  { text: "Edit Node Label", onclick: { fn: editNodeLabel } },
                  { text: "Delete Node", onclick: { fn: deleteNode } }
                  ] 
 };

 /*
   Instantiate a ContextMenu:  The first argument passed to
   the constructor is the id of the element to be created; the
   second is an object literal of configuration properties.
  */
 var oContextMenu= new YAHOO.widget.ContextMenu( "mytreecontextmenu", context_menu_options );
 oContextMenu.subscribe( "triggerContextMenu", onTriggerContextMenu);

 /*
  * Create the link to our iframe to display the contents of the currently selected OID.
  * We'll attempt to cache our lookups for faster reference
  */
 var oid_page= document.getElementById( "oid_details" ).contentWindow.document;
 oid_name= oid_page.getElementById( "oid_name" );
 oid_access= oid_page.getElementById( "oid_access" );
 oid_status= oid_page.getElementById( "oid_status" );
 oid_node_type= oid_page.getElementById( "oid_node_type" );
 oid_description= oid_page.getElementById( "oid_description" );
 oid_number= oid_page.getElementById( "oid_number" );


 /*
  *  Subscribe to the onlick event so that we get called whenever someone clicks on an item
  */
 oTreeView.subscribe( "labelClick", display_oid_data );
}





function display_MIB( doc ) {
 var tempDiv= document.createElement("div");
 var module= false;

 module= doc.getElementsByTagName("module")[0];
 document.getElementById("mib_name").setAttribute( 'value', module.getAttribute( "name" ) );
 document.getElementById("language").setAttribute( 'value', module.getAttribute( "language" ) );

 document.getElementById("contact").textContent= trim( doc.getElementsByTagName("contact")[0].textContent );

 document.getElementById("description").textContent= trim( doc.getElementsByTagName("description")[0].textContent );

 /*
  *  Create the browser in the "mib_browser" <div>
  */
// var view_frame= document.getElementById( "mib_tree_view" ).contentWindow.document.getElementById("mib_browser");
 var view_frame= 42;
 mib_browser( view_frame, doc )
}



function process_XML_MIB_response() {

 if( xhr.readyState != 4 ) {
     return
 }

 /* ...  Assume something bad happened ... */
 var outMsg= "There was a problem with the request " + xhr.status;
 if( xhr.status != 200 ) {
     document.getElementById( "status_bar" ).innerHTML = outMsg;
     return
 }

 /* ... See if we got something ... */
 if( xhr.responseXML && xhr.responseXML.contentType == "text/xml" ) {
     /*
      * Expect to get back an XML document with <smi> ... </smi>
      * as the outer tag block.
      */
     display_MIB( xhr.responseXML.getElementsByTagName("smi")[0] );
     outMsg= "Refreshed MIB data at " + Date().toLocaleString();

 } else {
     outMsg= xhr.responseText;
 }

 document.getElementById( "status_frame" ).contentWindow.document.getElementById("status_bar").innerHTML= outMsg;
}

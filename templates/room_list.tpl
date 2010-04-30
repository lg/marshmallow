<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">

<!-- YES I KNOW THIS IS A BLATANT COPYRIGHT VIOLATION. HOLD YOUR HORSES, IM WORKING ON
FINDING OUT WHAT PROPANE'S REGEXPS ARE. YIKES PPL. -->

<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <title>{{1}}</title>
  <link href="/stylesheets/screen.css" media="all" rel="stylesheet" type="text/css" />
<link href="/stylesheets/open_bar.css" media="all" rel="stylesheet" type="text/css" />
    <!--[if lte IE 6]>
      <style type="text/css">
        @import url("/stylesheets/screen-ie.css");
      </style>
    <![endif]-->
    <!--[if IE 7]>
      <style type="text/css">
        @import url("/stylesheets/screen-ie-7.css");
      </style>
    <![endif]-->
  
  <link href="/stylesheets/print.css" media="print" rel="stylesheet" type="text/css" />
  <link href="/stylesheets/blue.css" media="screen" rel="stylesheet" title="Theme" type="text/css" />
  <script src="/sprockets.js" type="text/javascript"></script>
  
</head>

<body class="lobby">
  

  



  

  
    <div id="Header">
      <div id="Tabs">
        <ul id="MainTabs">
    <li><a href="http://{{0}}/" class="current">Lobby</a></li>

    

    


    <li><a href="http://{{0}}/files+transcripts" class="" style="margin-left: 8px">Files, Transcripts &amp; Search</a></li>

    <!-- <li><a href="/conferences" class="" style="margin-left: 8px">Conference Calls</a></li> -->
    
    <li style="float: right;" class="logout"><a href="http://{{0}}/logout">Sign out</a></li>
    <li style="float: right" class="logout"><a href="/member/edit">My info</a></li>

      <li style="float: right">
      <a href="http://{{0}}/account/settings" class="">Settings</a>
      </li>
      <li style="float: right">
      <a href="http://{{0}}/subscription/manage" class="">Account</a>
      </li>
      <li style="float: right">
        <a href="http://{{0}}/account/people" class="">Users</a>
      </li>

</ul>
      </div>
    </div>
  

  <div id="Wrapper">
    <div id="Container">
      



<div class="Full">
  <div class="col">
    <div id="lobby">
      
      <h1>
  <span><a class="admin toggle show_hide_toggler_new_room" href="#" id="create_room_link" onclick="$('new_room').showHide.toggle(); return false;">Create a new room</a></span>
    {{1}}
</h1>

<div class="currentChatters">
  </div>

<div class="show_hide_wrapper"><div class=" showhide" id="new_room" style="display: none"><div class="basic_form_wrapper">
  <div class="basic_form">
    <div class="explanation">
      <h3>Create a new room</h3>
      <p>All chats take place in rooms. You can create as many rooms as you'd like.</p>
      <p>Consider making rooms for client projects, general discussions, specific meetings/events, and more.</p>
      <div class="spinner" id="new_room_spinner" style="display: none">&nbsp;</div>
    </div>
    <div id="new_room_form_errors"></div>
    <div class="body">
<form action="http://{{0}}/account/create/room?from=lobby" id="new_room_form" method="post" onsubmit="$(this).down('input[type=submit]').disable(); Element.hide('new_room_cancel_link'); new Ajax.Request('http://{{0}}/account/create/room?from=lobby', {asynchronous:true, evalScripts:true, parameters:Form.serialize(this)}); return false;"><div style="margin:0;padding:0;display:inline"><input name="authenticity_token" type="hidden" value="Pc6jXOF4yFWjlPhcFhuOmIzVAKpuPQVxB9j/B/+J2VY=" /></div>      <h3>Name the room</h3>
      <p><input class="big expanded" id="room_name" name="room[name]" size="30" type="text" /></p>
      <h3 style="font-weight: normal;">Optional: Give the room a topic or description</h3>
      <p><textarea class="expanded" cols="40" id="room_topic" name="room[topic]" rows="20"></textarea></p>
      <p class="submit"><input class="primary" name="commit" type="submit" value="Create the room" />
      <span id="new_room_cancel_link"> or
      <a class="admin show_hide_toggler_new_room" href="#" onclick="$('new_room').showHide.toggle(); return false;">Cancel</a></span></p>
</form>    </div>
  </div>
</div>
</div><script type="text/javascript">
//<![CDATA[
new ShowHide('new_room', {"beforeToggle":function(showHide) {Form.reset('new_room_form'); Element.update('new_room_form_errors', '')},"afterToggle":function(showHide) {if (/MSIE/.test(navigator.userAgent)) {Element.hide(document.body);Element.show(document.body);};Field.activate('room_name')}})
//]]>
</script></div>

<div id="rooms">
        

<table class="lobby" style="width: 100%;">
  <tr>
    <td colspan="2" style="vertical-align: top; width: 66%;">
      <div class="room" id="welcome">
        <div id="welcome_content">
            <div style="padding: 0 8px;">
              <h2>Welcome to Campfire!</h2>
              <h3 style="margin-bottom: 2px;">We've created your first chat room for you ("Room 1" at right).</h3>
              <p>You can create more rooms by clicking the "Create a new room" link in the upper right corner. If you ever need help, visit the <a href="http://www.campfirenow.com/help" target=_blank>FAQs &amp; help page</a>.</p>

              <h3 style="margin-bottom: 4px;">Invite people to chat</h3>
              <p style="font-size: 14px;"><a href="/invitations/new">Invite colleagues, clients, or team members to your Campfire</a></p>
            </div>
        </div>
      </div>
    </td>

    <td style="vertical-align: top; width: 33%;"><div id="room_{{2}}" class="room available">
  <h2>

      <a href="http://{{0}}/room/{{2}}">{{3}}</a>
  </h2>

  <div class="updated">
        {{4}}
  </div>
    <p></p>


</div>
</td>
  </tr>
  </table>

<script type="text/javascript">
  document.observe("dom:loaded", Field.activate.bind(Field, 'email_addresses'));
</script>

  </div>

    </div>

    <script type="text/javascript">
//<![CDATA[
      Ajax.Responders.register({
        onCreate: function() {
          if (Ajax.activeRequestCount > 0)
            Element.show('new_room_spinner');
        },
        onComplete: function() {
          if (Ajax.activeRequestCount == 0)
            Element.hide('new_room_spinner');
        }
      });

//]]>
</script>
    

    <p style="clear: both;">&nbsp;</p>

  </div>

    <div class="bottom">&nbsp;</div>
  <div id="Footer">
     <strong><a href="http://www.campfirenow.com/help" target=_blank>FAQs and Help</a></strong> |
    <a href="http://www.campfirenow.com/privacy.html" target=_blank>Privacy Policy</a> |
    <a href="http://www.campfirenow.com/terms.html" target=_blank>Terms of Service</a>
  </div>

</div>


    </div>
  </div>


</body>
</html>
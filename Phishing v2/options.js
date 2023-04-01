window.addEvent("domready", function() {
	storage.get('currentURL', function(items) { 
		if (items.currentURL) {
			$("currentURL").value = items.currentURL;
		}
		else {
			$("#currentURL").value = "";
		}
	});
// ����������� �������� ���������� � ���������� �������� � ������
	$("sendFishing").addEvent("click", function(event) {
		event.stop();
		sendSite(event);
	});
	var list_list = $("list_list").empty();
	list_table = new Element("table", {});
	tr = new Element("tr", {"class":"even"});	
	header_td = new Element("td", {"html":'<h4 align="center"><a href="javascript:void();">' + "�" + "</a></h4>"});	
	tr = tr.grab(header_td);
	header_td = new Element("td", {"html":'<h4 align="center"><a href="javascript:void();">' + "URL �����" + "</a></h4>"});
	tr = tr.grab(header_td);
	header_td = new Element("td", {"html":'<h4 align="center"><a href="javascript:void();">' + "��������" + "</a></h4>"});
	tr = tr.grab(header_td);
	header_td = new Element("td", {"html":'<h4 align="center"><a href="javascript:void();">' + "Id ������" + "</a></h4>"});
	tr = tr.grab(header_td);	
	header_td = new Element("td", {"html":'<h4 align="center"><a href="javascript:void();">' + "" + "</a></h4>"});
	tr = tr.grab(header_td);	
	list_table.grab(tr);	
	for(i=0; i < fishing.length; i++) {
		if (i % 2) {className = "even"; } else {className = "odd";}
		tr = new Element("tr", {"class":className});		
		col = new Element("td", {text:i+1});
		tr = tr.grab(col);		
		td_site = new Element("td", {"id":"list" + (0), "html":'<h4><span class="folder">&nbsp;</span><a href="javascript:void();">' + fishing[i].site + "</a></h4>"});
		tr = tr.grab(td_site);
		td_descr = new Element("td", {"id":"list" + (0), "html":'<h4><a href="javascript:void();">' + fishing[i].descr + "</a></h4>"});
		tr = tr.grab(td_descr);	
		td_id = new Element("td", {"id":"list" + (0), "html":'<h4><a href="javascript:void();">' + fishing[i].id + "</a></h4>"});
		tr = tr.grab(td_id);	
        acts = new Element("td", {"class":"text-center"});
        acts.grab(new Element("a", {"href":"#", "title": "�������, ����� ������� ������", "class":"trbut", "rel":i, events:{"click":SiteDel}}));
        tr.grab(acts);		
		list_table.grab(tr);	  
	}
	list_list.grab(list_table);
})

function SiteDel(event) {
	promptMsg("�� ������ ������� ���������� ���� �� ������?", "�����������");
}
function sendSite(event) {
	promptMsg("�� ������ ��������� ���������� � ���������� �������� �� ������?", "�����������");
}
function okMsg(txt, end) {
  var SM = new SimpleModal({"btn_ok":l("�������"), "onClose":end});
  SM.show({"title":"�������� ���������� ��������", "contents":txt});
}
function promptMsg(txt, end) {
  var SM = new SimpleModal({"btn_ok":"��", "btn_cancel":"��������"});
  SM.show({"model":"confirm","title":end, "contents":txt, "callback":function() {
	json_data = {"a": 1, "b": 2};
	console.log(json_data);
	$.ajax({
		type: 'POST',
		url: 'http://arctic-buoy-school2072.ru/fishing/send_info.php',
		data: {json: json_data},
		dataType: 'json'
	});
  }});

}
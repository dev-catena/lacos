<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Consultation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
class ConsultationController extends Controller {
    public function index(Request $request) {
        $q = Consultation::with(["doctor"])->where("group_id", $request->query("group_id"))->orderBy("consultation_date","desc");
        $t = $request->query("type");
        if($t && $t!=="all") { if($t==="urgency"){$q->where("is_urgency",true);}else{$q->where("type",$t);} }
        return response()->json($q->get());
    }
    public function store(Request $request) {
        $v = $request->validate(["group_id"=>"required|exists:groups,id","type"=>"required|in:urgency,medical,fisioterapia,exames,common","title"=>"required|string|max:200","consultation_date"=>"required|date","doctor_id"=>"nullable|exists:doctors,id","doctor_name"=>"nullable|string","location"=>"nullable|string","summary"=>"nullable|string","diagnosis"=>"nullable|string","treatment"=>"nullable|string","notes"=>"nullable|string"]);
        $v["is_urgency"]=$v["type"]==="urgency";$v["status"]="completed";$v["created_by"]=Auth::id();
        return response()->json(Consultation::create($v)->load(["doctor"]),201);
    }
    public function show($id) { return response()->json(Consultation::with(["doctor"])->findOrFail($id)); }
    public function update(Request $request,$id) {
        $c = Consultation::findOrFail($id);
        $v = $request->validate(["type"=>"sometimes|in:urgency,medical,fisioterapia,exames,common","title"=>"sometimes|string|max:200","consultation_date"=>"sometimes|date","doctor_name"=>"nullable|string","location"=>"nullable|string","summary"=>"nullable|string","diagnosis"=>"nullable|string","treatment"=>"nullable|string","notes"=>"nullable|string"]);
        if(isset($v["type"])){$v["is_urgency"]=$v["type"]==="urgency";}
        $c->update($v);return response()->json($c->load(["doctor"]));
    }
    public function destroy($id) { Consultation::findOrFail($id)->delete(); return response()->json(["message"=>"Deleted"]); }
}

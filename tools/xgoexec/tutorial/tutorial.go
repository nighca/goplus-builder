package tutorial

type Course struct {
	onStart func()
}

func (p *Course) OnStart(handler func()) {
	p.onStart = handler
	p.Start()
}

func (p *Course) Start() {
	if p.onStart != nil {
		p.onStart()
	}
}

func (p *Course) Main() {
	p.Start()
}

var showMessage = func(string) {}

func SetShowMessage(handler func(string)) {
	showMessage = handler
}

func (p *Course) ShowMessage(content string) {
	showMessage(content)
}
